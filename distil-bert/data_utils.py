import pandas as pd
import torch
from torch.utils.data import Dataset
from transformers import DistilBertTokenizerFast

class CustomNewsDataset(Dataset):
    def __init__(self, file_path, tokenizer, max_len=512):
        df = pd.read_csv(file_path)
        # Expecting columns: title, text, label
        # Combine title and text for richer context
        self.texts = (df['title'].fillna('') + '. ' + df['text'].fillna('')).tolist()
        self.labels = df['label'].tolist()
        self.encodings = tokenizer(
            self.texts,
            truncation=True,
            padding=True,
            max_length=max_len
        )

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        item = {k: torch.tensor(v[idx]) for k, v in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[idx])
        return item


def get_tokenizer():
    return DistilBertTokenizerFast.from_pretrained('distilbert-base-uncased')
