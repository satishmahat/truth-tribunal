import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, random_split
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, ConfusionMatrixDisplay
import matplotlib.pyplot as plt
from tqdm import tqdm
import os
import urllib.request
import tarfile
import glob
import re
from collections import Counter
from itertools import chain
from torch.optim.lr_scheduler import ReduceLROnPlateau

# 1. IMDb Dataset Download and Loader

def download_and_extract_imdb(data_dir='imdb_data'):
    url = "https://ai.stanford.edu/~amaas/data/sentiment/aclImdb_v1.tar.gz"
    if not os.path.exists(data_dir):
        os.makedirs(data_dir, exist_ok=True)
    tar_path = os.path.join(data_dir, "aclImdb_v1.tar.gz")
    if not os.path.exists(os.path.join(data_dir, "aclImdb")):
        if not os.path.exists(tar_path):
            print("Downloading IMDb dataset...")
            urllib.request.urlretrieve(url, tar_path)
        print("Extracting IMDb dataset...")
        with tarfile.open(tar_path, "r:gz") as tar:
            tar.extractall(path=data_dir)
        print("IMDb dataset downloaded and extracted.")
    else:
        print("IMDb dataset already present.")

download_and_extract_imdb()

class IMDBDataset(Dataset):
    def __init__(self, root_dir, split, vocab=None, max_seq_len=512):
        self.samples = []
        self.labels = []
        self.max_seq_len = max_seq_len
        for label in ['pos', 'neg']:
            files = glob.glob(os.path.join(root_dir, split, label, '*.txt'))
            for f in files:
                with open(f, encoding='utf-8') as file:
                    text = file.read().strip()
                    self.samples.append(text)
                    self.labels.append(1 if label == 'pos' else 0)
        # Always build vocab if not provided
        if vocab is None:
            self.vocab = self.build_vocab()
        else:
            self.vocab = vocab
        # Pre-tokenize for speed
        self.tokenized = [re.findall(r'\w+', s.lower()) for s in self.samples]
        if len(self.samples) == 0:
            raise ValueError(f"No samples found in {root_dir}/{split}")
    def build_vocab(self):
        counter = Counter(chain.from_iterable([re.findall(r'\w+', s.lower()) for s in self.samples]))
        vocab = {'<pad>': 0, '<unk>': 1}
        for word, _ in counter.most_common(20000):
            vocab[word] = len(vocab)
        return vocab
    def __len__(self):
        return len(self.samples)
    def __getitem__(self, idx):
        tokens = self.tokenized[idx]
        ids = [self.vocab.get(token, self.vocab['<unk>']) for token in tokens]
        # Pad/truncate
        if len(ids) < self.max_seq_len:
            ids += [self.vocab['<pad>']] * (self.max_seq_len - len(ids))
        else:
            ids = ids[:self.max_seq_len]
        return torch.tensor(ids, dtype=torch.long), torch.tensor(self.labels[idx], dtype=torch.float)

# 2. Model: BiGRU + CNN Hybrid (with recommended settings)
class BiGRU_CNN(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_dim, output_dim, n_layers, bidirectional, dropout_gru, cnn_kernel_sizes, cnn_num_filters, dropout_cnn, fc_hidden_dim, dropout_fc, pad_idx):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=pad_idx)
        self.gru = nn.GRU(embedding_dim, hidden_dim, num_layers=n_layers,
                            bidirectional=bidirectional, batch_first=True, dropout=dropout_gru)
        self.convs = nn.ModuleList([
            nn.Conv1d(in_channels=hidden_dim*2, out_channels=cnn_num_filters, kernel_size=k)
            for k in cnn_kernel_sizes
        ])
        self.dropout_cnn = nn.Dropout(dropout_cnn)
        self.fc1 = nn.Linear(len(cnn_kernel_sizes)*cnn_num_filters, fc_hidden_dim)
        self.dropout_fc = nn.Dropout(dropout_fc)
        self.fc2 = nn.Linear(fc_hidden_dim, output_dim)
    def forward(self, text):
        # Assert all indices are in range
        assert (text < self.embedding.num_embeddings).all(), f"Input index out of range for embedding: max {text.max().item()}, vocab size {self.embedding.num_embeddings}"
        embedded = self.embedding(text)
        gru_out, _ = self.gru(embedded)
        gru_out = gru_out.permute(0, 2, 1)
        conv_outs = [torch.relu(conv(gru_out)) for conv in self.convs]
        pooled = [torch.max(conv_out, dim=2)[0] for conv_out in conv_outs]
        cat = torch.cat(pooled, dim=1)
        x = self.dropout_cnn(cat)
        x = torch.relu(self.fc1(x))
        x = self.dropout_fc(x)
        return self.fc2(x)

# 3. Hyperparameters (Exp. 20 from Table)
VOCAB_SIZE = 10000
EMBEDDING_DIM = 256
HIDDEN_DIM = 250
OUTPUT_DIM = 1
N_LAYERS = 1
BIDIRECTIONAL = True
DROPOUT_GRU = 0.4
CNN_KERNEL_SIZES = [2, 3, 4, 5]
CNN_NUM_FILTERS = 96
DROPOUT_CNN = 0.4
FC_HIDDEN_DIM = 32
DROPOUT_FC = 0.4
PAD_IDX = 0
BATCH_SIZE = 32
LEARNING_RATE = 2e-5
EPOCHS = 50
WEIGHT_DECAY = 0.15
GRAD_CLIP = 1.0
MAX_SEQ_LEN = 512

# 4. Data (use IMDb) - Modified to combine train and test
imdb_root = 'imdb_data/aclImdb'

# Create a combined dataset from both train and test
class CombinedIMDBDataset(Dataset):
    def __init__(self, root_dir, vocab=None, max_seq_len=512):
        self.samples = []
        self.labels = []
        self.max_seq_len = max_seq_len
        
        # Load from both train and test directories
        for split in ['train', 'test']:
            for label in ['pos', 'neg']:
                files = glob.glob(os.path.join(root_dir, split, label, '*.txt'))
                for f in files:
                    with open(f, encoding='utf-8') as file:
                        text = file.read().strip()
                        self.samples.append(text)
                        self.labels.append(1 if label == 'pos' else 0)
        
        # Build vocab if not provided
        if vocab is None:
            self.vocab = self.build_vocab()
        else:
            self.vocab = vocab
        
        # Pre-tokenize for speed
        self.tokenized = [re.findall(r'\w+', s.lower()) for s in self.samples]
        if len(self.samples) == 0:
            raise ValueError(f"No samples found in {root_dir}")
    
    def build_vocab(self):
        counter = Counter(chain.from_iterable([re.findall(r'\w+', s.lower()) for s in self.samples]))
        vocab = {'<pad>': 0, '<unk>': 1}
        for word, _ in counter.most_common(20000):
            vocab[word] = len(vocab)
        return vocab
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        tokens = self.tokenized[idx]
        ids = [self.vocab.get(token, self.vocab['<unk>']) for token in tokens]
        # Pad/truncate
        if len(ids) < self.max_seq_len:
            ids += [self.vocab['<pad>']] * (self.max_seq_len - len(ids))
        else:
            ids = ids[:self.max_seq_len]
        return torch.tensor(ids, dtype=torch.long), torch.tensor(self.labels[idx], dtype=torch.float)

# Create combined dataset
combined_dataset = CombinedIMDBDataset(imdb_root, max_seq_len=MAX_SEQ_LEN)
os.makedirs('result', exist_ok=True)
torch.save(combined_dataset.vocab, 'result/vocab.pt')

# Set VOCAB_SIZE to match the actual vocab size
VOCAB_SIZE = len(combined_dataset.vocab)

# Custom split: 34k train, 8k val, 8k test (total 50k)
train_size = 34000
val_size = 8000
test_size = 8000

# Verify total size
total_size = len(combined_dataset)
print(f"Total dataset size: {total_size}")
print(f"Requested split: {train_size} train, {val_size} val, {test_size} test")
print(f"Total requested: {train_size + val_size + test_size}")

if train_size + val_size + test_size > total_size:
    print(f"Warning: Requested split ({train_size + val_size + test_size}) exceeds total size ({total_size})")
    # Adjust test size to fit
    test_size = total_size - train_size - val_size
    print(f"Adjusted test size to: {test_size}")

# Create the splits
train_dataset, temp_dataset = random_split(
    combined_dataset, [train_size, val_size + test_size], 
    generator=torch.Generator().manual_seed(42)
)
val_dataset, test_dataset = random_split(
    temp_dataset, [val_size, test_size], 
    generator=torch.Generator().manual_seed(42)
)

print(f"Final split sizes:")
print(f"Train: {len(train_dataset)}")
print(f"Validation: {len(val_dataset)}")
print(f"Test: {len(test_dataset)}")

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE)
test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE)

# 5. Training Setup
os.makedirs('result', exist_ok=True)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = BiGRU_CNN(VOCAB_SIZE, EMBEDDING_DIM, HIDDEN_DIM, OUTPUT_DIM, N_LAYERS, BIDIRECTIONAL, DROPOUT_GRU, CNN_KERNEL_SIZES, CNN_NUM_FILTERS, DROPOUT_CNN, FC_HIDDEN_DIM, DROPOUT_FC, PAD_IDX).to(device)
optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
criterion = nn.BCEWithLogitsLoss().to(device)
scheduler = ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2)

# Early stopping parameters
best_val_loss = float('inf')
patience = 50
counter = 0

def binary_accuracy(preds, y):
    rounded = torch.round(torch.sigmoid(preds))
    return (rounded == y).float().sum() / len(y)

# 6. Training Loop (with grad clip and tqdm)
train_losses, val_losses = [], []
train_accuracies, val_accuracies = [], []
for epoch in range(EPOCHS):
    print(f"Epoch {epoch+1}/{EPOCHS}")
    # Training with tqdm progress bar
    model.train()
    epoch_loss, epoch_acc = 0, 0
    all_preds, all_labels = [], []
    train_bar = tqdm(train_loader, desc=f"Train Epoch {epoch+1}/{EPOCHS}")
    for texts, labels in train_bar:
        texts, labels = texts.to(device), labels.to(device)
        optimizer.zero_grad()
        try:
            predictions = model(texts).squeeze(1)
            loss = criterion(predictions, labels)
            acc = binary_accuracy(predictions, labels)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), GRAD_CLIP)
            optimizer.step()
        except RuntimeError as e:
            if 'CUDA error' in str(e):
                print('CUDA error detected. Try running with CUDA_LAUNCH_BLOCKING=1 for more info.')
                raise
            else:
                raise
        epoch_loss += loss.item()
        epoch_acc += acc.item()
        all_preds += torch.round(torch.sigmoid(predictions)).detach().cpu().numpy().tolist()
        all_labels += labels.detach().cpu().numpy().tolist()
        train_bar.set_postfix({'loss': loss.item(), 'acc': acc.item() * 100})
    train_loss = epoch_loss / len(train_loader)
    train_acc = epoch_acc / len(train_loader)
    train_losses.append(train_loss)
    train_accuracies.append(train_acc)

    # Validation with tqdm progress bar
    model.eval()
    val_loss, val_acc = 0, 0
    val_preds, val_labels = [], []
    val_bar = tqdm(val_loader, desc=f"Validation Epoch {epoch+1}/{EPOCHS}")
    with torch.no_grad():
        for texts, labels in val_bar:
            texts, labels = texts.to(device), labels.to(device)
            try:
                predictions = model(texts).squeeze(1)
                loss = criterion(predictions, labels)
                acc = binary_accuracy(predictions, labels)
            except RuntimeError as e:
                if 'CUDA error' in str(e):
                    print('CUDA error detected. Try running with CUDA_LAUNCH_BLOCKING=1 for more info.')
                    raise
                else:
                    raise
            val_loss += loss.item()
            val_acc += acc.item()
            val_preds += torch.round(torch.sigmoid(predictions)).detach().cpu().numpy().tolist()
            val_labels += labels.detach().cpu().numpy().tolist()
            val_bar.set_postfix({'loss': loss.item(), 'acc': acc.item() * 100})
    val_loss = val_loss / len(val_loader)
    val_acc = val_acc / len(val_loader)
    val_losses.append(val_loss)
    val_accuracies.append(val_acc)

    print(f'  Train Loss: {train_loss:.3f} | Train Acc: {train_acc*100:.2f}%')
    print(f'  Val   Loss: {val_loss:.3f} | Val   Acc: {val_acc*100:.2f}%')

    # Step the learning rate scheduler
    scheduler.step(val_loss)

    # Early stopping
    if val_loss < best_val_loss:
        best_val_loss = val_loss
        counter = 0
        # Save best model
        torch.save(model.state_dict(), 'result/best_model.pt')
    else:
        counter += 1
        if counter >= patience:
            print('Early stopping!')
            break

# Save the trained model
MODEL_PATH = 'result/bigru_cnn_sentiment.pt'
torch.save(model.state_dict(), MODEL_PATH)
print(f"Trained model saved to {MODEL_PATH}")

# 7. Evaluation and Metrics
model.eval()
def get_preds_labels(loader, desc):
    all_preds, all_labels = [], []
    with torch.no_grad():
        for texts, labels in tqdm(loader, desc=desc):
            texts, labels = texts.to(device), labels.to(device)
            predictions = model(texts).squeeze(1)
            preds = torch.round(torch.sigmoid(predictions)).cpu().numpy()
            all_preds.extend(preds)
            all_labels.extend(labels.cpu().numpy())
    return all_preds, all_labels

# Get predictions and labels for all splits
train_preds, train_labels = get_preds_labels(train_loader, 'Train (Eval)')
val_preds, val_labels = get_preds_labels(val_loader, 'Validation (Eval)')
test_preds, test_labels = get_preds_labels(test_loader, 'Test (Eval)')

splits = {
    'train': (train_loader, train_preds, train_labels),
    'val': (val_loader, val_preds, val_labels),
    'test': (test_loader, test_preds, test_labels)
}

for split, (loader, preds, labels) in splits.items():
    print(f"\n{split.capitalize()} Classification Report:")
    print(classification_report(labels, preds, digits=4))
    cm = confusion_matrix(labels, preds)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm)
    disp.plot(cmap='Blues')
    plt.title(f"{split.capitalize()} Confusion Matrix")
    plt.savefig(f"result/{split}_confusion_matrix.png")
    plt.close()

# 8. Plot Loss and Accuracy
plt.plot(train_losses, label='Train Loss')
plt.plot(val_losses, label='Validation Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()
plt.title('Loss Over Epochs')
plt.grid(True)
plt.savefig('result/loss_plot.png')
plt.close()

plt.plot(train_accuracies, label='Train Accuracy')
plt.plot(val_accuracies, label='Validation Accuracy')
plt.xlabel('Epoch')
plt.ylabel('Accuracy')
plt.legend()
plt.title('Accuracy Over Epochs')
plt.grid(True)
plt.savefig('result/accuracy_plot.png')
plt.close()
