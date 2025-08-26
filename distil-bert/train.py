import torch
from torch.utils.data import DataLoader
import matplotlib.pyplot as plt
from transformers import DistilBertForSequenceClassification
from torch.optim import AdamW
from sklearn.metrics import confusion_matrix, classification_report
from data_utils import CustomNewsDataset, get_tokenizer
import numpy as np
from tqdm import tqdm


def train():
    tokenizer = get_tokenizer()
    model = DistilBertForSequenceClassification.from_pretrained(
        'distilbert-base-uncased', num_labels=2
    )
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.to(device)

    # Paths to your CSVs
    train_path = 'data/train.csv'
    valid_path = 'data/valid.csv'
    test_path  = 'data/test.csv'

    # Create datasets and loaders
    train_ds = CustomNewsDataset(train_path, tokenizer)
    val_ds   = CustomNewsDataset(valid_path, tokenizer)
    test_ds  = CustomNewsDataset(test_path, tokenizer)

    train_loader = DataLoader(train_ds, batch_size=16, shuffle=True)
    val_loader   = DataLoader(val_ds, batch_size=16)
    test_loader  = DataLoader(test_ds, batch_size=16)

    optimizer = AdamW(model.parameters(), lr=5e-5)
    train_losses, val_losses = [], []
    train_accuracies, val_accuracies = [], []

    best_val_loss = float('inf')
    best_model_path = 'fine_tuned_distilbert'

    # Training loop
    for epoch in range(5):
        model.train()
        total_train_loss = 0
        all_train_preds, all_train_labels = [], []
        for batch in tqdm(train_loader, desc=f"Epoch {epoch+1} [Train]"):
            batch = {k: v.to(device) for k, v in batch.items()}
            optimizer.zero_grad()
            outputs = model(**batch)
            loss = outputs.loss
            loss.backward()
            optimizer.step()
            total_train_loss += loss.item()
            preds = torch.argmax(outputs.logits, dim=1).cpu().numpy()
            all_train_preds.extend(preds)
            all_train_labels.extend(batch['labels'].cpu().numpy())
        avg_train_loss = total_train_loss / len(train_loader)
        train_losses.append(avg_train_loss)
        train_accuracy = (np.array(all_train_preds) == np.array(all_train_labels)).mean()
        train_accuracies.append(train_accuracy)

        model.eval()
        total_val_loss = 0
        all_preds, all_labels = [], []
        with torch.no_grad():
            for batch in tqdm(val_loader, desc=f"Epoch {epoch+1} [Val]"):
                batch = {k: v.to(device) for k, v in batch.items()}
                outputs = model(**batch)
                total_val_loss += outputs.loss.item()
                preds = torch.argmax(outputs.logits, dim=1).cpu().numpy()
                all_preds.extend(preds)
                all_labels.extend(batch['labels'].cpu().numpy())
        avg_val_loss = total_val_loss / len(val_loader)
        val_losses.append(avg_val_loss)
        val_accuracy = (np.array(all_preds) == np.array(all_labels)).mean()
        val_accuracies.append(val_accuracy)

        # Save the best model
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            model.save_pretrained(best_model_path)
            tokenizer.save_pretrained(best_model_path)

        print(f"Epoch {epoch+1} | Train Loss: {avg_train_loss:.4f} | Val Loss: {avg_val_loss:.4f} | Train Acc: {train_accuracy:.4f} | Val Acc: {val_accuracy:.4f}")

    # Load the best model for evaluation
    model = DistilBertForSequenceClassification.from_pretrained(best_model_path)
    model.to(device)

    # Evaluate on train set with best model
    model.eval()
    all_train_preds, all_train_labels = [], []
    with torch.no_grad():
        for batch in train_loader:
            batch = {k: v.to(device) for k, v in batch.items()}
            outputs = model(**batch)
            preds = torch.argmax(outputs.logits, dim=1).cpu().numpy()
            all_train_preds.extend(preds)
            all_train_labels.extend(batch['labels'].cpu().numpy())
    train_cm = confusion_matrix(all_train_labels, all_train_preds)
    plt.figure()
    plt.imshow(train_cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('Train Confusion Matrix (Best Model)')
    plt.colorbar()
    tick_marks = range(2)
    plt.xticks(tick_marks, ['fake', 'real'])
    plt.yticks(tick_marks, ['fake', 'real'])
    plt.xlabel('Predicted label')
    plt.ylabel('True label')
    plt.tight_layout()
    thresh = train_cm.max() / 2.
    for i in range(train_cm.shape[0]):
        for j in range(train_cm.shape[1]):
            plt.text(j, i, format(train_cm[i, j], 'd'),
                     ha="center", va="center",
                     color="white" if train_cm[i, j] > thresh else "black")
    plt.savefig('train_confusion_matrix.png')
    plt.close()

    # Evaluate on validation set with best model
    all_val_preds, all_val_labels = [], []
    with torch.no_grad():
        for batch in val_loader:
            batch = {k: v.to(device) for k, v in batch.items()}
            outputs = model(**batch)
            preds = torch.argmax(outputs.logits, dim=1).cpu().numpy()
            all_val_preds.extend(preds)
            all_val_labels.extend(batch['labels'].cpu().numpy())
    val_cm = confusion_matrix(all_val_labels, all_val_preds)
    plt.figure()
    plt.imshow(val_cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('Validation Confusion Matrix (Best Model)')
    plt.colorbar()
    tick_marks = range(2)
    plt.xticks(tick_marks, ['fake', 'real'])
    plt.yticks(tick_marks, ['fake', 'real'])
    plt.xlabel('Predicted label')
    plt.ylabel('True label')
    plt.tight_layout()
    thresh = val_cm.max() / 2.
    for i in range(val_cm.shape[0]):
        for j in range(val_cm.shape[1]):
            plt.text(j, i, format(val_cm[i, j], 'd'),
                     ha="center", va="center",
                     color="white" if val_cm[i, j] > thresh else "black")
    plt.savefig('val_confusion_matrix.png')
    plt.close()

    # Plot loss and accuracy curves
    epochs = range(1, len(train_losses) + 1)
    plt.figure()
    plt.plot(epochs, train_losses, label='Train Loss')
    plt.plot(epochs, val_losses, label='Validation Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    plt.savefig('loss_curve.png')
    plt.close()

    plt.figure()
    plt.plot(epochs, train_accuracies, label='Train Accuracy')
    plt.plot(epochs, val_accuracies, label='Validation Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    plt.savefig('accuracy_curve.png')
    plt.close()

    # Evaluate on test set with best model
    all_preds, all_labels = [], []
    with torch.no_grad():
        for batch in test_loader:
            batch = {k: v.to(device) for k, v in batch.items()}
            outputs = model(**batch)
            preds = torch.argmax(outputs.logits, dim=1).cpu().numpy()
            all_preds.extend(preds)
            all_labels.extend(batch['labels'].cpu().numpy())

    cm = confusion_matrix(all_labels, all_preds)
    print('Test Confusion Matrix:\n', cm)
    print(classification_report(all_labels, all_preds, target_names=['fake','real']))

    # Plot and save test confusion matrix with numbers
    plt.figure()
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('Test Confusion Matrix')
    plt.colorbar()
    tick_marks = range(2)
    plt.xticks(tick_marks, ['fake', 'real'])
    plt.yticks(tick_marks, ['fake', 'real'])
    plt.xlabel('Predicted label')
    plt.ylabel('True label')
    plt.tight_layout()
    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(j, i, format(cm[i, j], 'd'),
                     ha="center", va="center",
                     color="white" if cm[i, j] > thresh else "black")
    plt.savefig('test_confusion_matrix.png')
    plt.close()

    # Save the fine-tuned model

if __name__ == '__main__':
    train()