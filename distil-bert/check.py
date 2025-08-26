import pandas as pd

# Load your splits
train_df = pd.read_csv('data/train.csv')
val_df = pd.read_csv('data/valid.csv')
test_df = pd.read_csv('data/test.csv')

# Print number of samples in each split
print(f"Train samples: {len(train_df)}")
print(f"Validation samples: {len(val_df)}")
print(f"Test samples: {len(test_df)}")

# Check for overlap (leakage) between splits
train_texts = set(train_df['text'])
val_texts = set(val_df['text'])
test_texts = set(test_df['text'])

print(f"Train/Val overlap: {len(train_texts & val_texts)}")
print(f"Train/Test overlap: {len(train_texts & test_texts)}")
print(f"Val/Test overlap: {len(val_texts & test_texts)}")

# Check class distribution
print("\nClass distribution:")
print("Train:\n", train_df['label'].value_counts())
print("Validation:\n", val_df['label'].value_counts())
print("Test:\n", test_df['label'].value_counts())