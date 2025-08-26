import os
import pandas as pd
from sklearn.model_selection import train_test_split

# Ensure the data directory exists
if not os.path.exists('data'):
    os.makedirs('data')

# Paths to CSVs
fake_path = os.path.join('big data', 'data', 'Fake.csv')
real_path = os.path.join('big data', 'data', 'True.csv')

# Load datasets
fake_news = pd.read_csv(fake_path)
real_news = pd.read_csv(real_path)

# Add labels
fake_news['label'] = 1  # 1 for fake
real_news['label'] = 0  # 0 for real

# Ensure equal number of samples from each class
min_samples = min(len(fake_news), len(real_news), 32000)
fake_news = fake_news.sample(n=min_samples, random_state=42).reset_index(drop=True)
real_news = real_news.sample(n=min_samples, random_state=42).reset_index(drop=True)

# Combine and shuffle the full dataset
full_df = pd.concat([fake_news, real_news], ignore_index=True).sample(frac=1, random_state=42).reset_index(drop=True)

# After combining and shuffling
full_df = full_df.drop_duplicates(subset=['title', 'text']).reset_index(drop=True)

# Split indices for each class (total, not per class now)
n_train, n_valid, n_test = 24000, 6000, 2000
assert n_train + n_valid + n_test <= len(full_df), "Not enough data for requested splits!"

train = full_df.iloc[:n_train]
valid = full_df.iloc[n_train:n_train+n_valid]
test = full_df.iloc[n_train+n_valid:n_train+n_valid+n_test]

# Keep only necessary columns
train = train[['title', 'text', 'label']]
valid = valid[['title', 'text', 'label']]
test = test[['title', 'text', 'label']]

# Save splits
train.to_csv('data/train.csv', index=False)
valid.to_csv('data/valid.csv', index=False)
test.to_csv('data/test.csv', index=False)

print(f"Dataset prepared successfully!")
print(f"Training samples: {len(train)}")
print(f"Validation samples: {len(valid)}")
print(f"Testing samples: {len(test)}")
print("\nSample of training data:")
print(train.head()) 