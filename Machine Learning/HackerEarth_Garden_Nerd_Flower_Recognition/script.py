import cv2
import glob
import ipywidgets
import math
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import sklearn
import sklearn.model_selection
import time
import tensorflow as tf
import tensorflow.keras as keras

IMG_SIZE = 224
IMG_SHAPE = [IMG_SIZE, IMG_SIZE, 3]

NUM_CLASSES = 102
BATCH_SIZE = 32


class DataGenerator(keras.utils.Sequence):

    # Generates data for Keras
    def __init__(self, filenames, labels, batch_size=BATCH_SIZE, n_classes=NUM_CLASSES, shuffle=True):
        self.filenames = filenames
        self.labels = labels
        self.batch_size = batch_size
        self.n_classes = n_classes
        self.shuffle = shuffle
        self.on_epoch_end()

    # Generate one batch of data
    def __getitem__(self, batch_index):

        # Generate indexes of the batch
        batch_start = batch_index * self.batch_size
        batch_end = (batch_index + 1) * self.batch_size

        batch_indices = self.indexes[batch_start:batch_end]

        batch_filenames = [self.filenames[i] for i in batch_indices]
        batch_labels = [self.labels[i] for i in batch_indices]

        batch_x = []
        batch_y = []

        # Generate data
        for i in range(self.batch_size):
            pil_image = keras.preprocessing.image.load_img(batch_filenames[i], target_size=(IMG_SIZE, IMG_SIZE))
            image_array = keras.preprocessing.image.img_to_array(pil_image)
            batch_x.append(image_array)
            batch_y.append(batch_labels[i])

        batch_x = np.array(batch_x)
        batch_y = keras.utils.to_categorical(batch_y, num_classes=self.n_classes)

        return batch_x, batch_y

    # Updates indexes after each epoch
    def on_epoch_end(self):
        self.indexes = np.arange(len(self.filenames))
        if self.shuffle == True:
            np.random.shuffle(self.indexes)

    # Denotes the number of batches per epoch
    def __len__(self):
        return int(np.floor(len(self.filenames) / self.batch_size))


# Load Data
df = pd.read_csv("./Machine Learning/HackerEarth_Garden_Nerd_Flower_Recognition/data/train.csv")
df['filename'] = './Machine Learning/HackerEarth_Garden_Nerd_Flower_Recognition/data/train/' + df['image_id'].astype(str) + '.jpg'

filenames = []
labels = []
for index, row in df.iterrows():
    filenames.append(row['filename'])
    labels.append(row['category'] - 1)

print("Sample filenames : ", filenames[:4])
print("Sample labels : ", labels[:4])

train_x, val_x, train_y, val_y = sklearn.model_selection.train_test_split(filenames[:], labels[:], test_size=0.2, random_state=64)
print("{} examples in training set".format(len(train_y)))
print("{} examples in validation set".format(len(val_y)))

# Creating generators
training_generator = DataGenerator(train_x, train_y)
validation_generator = DataGenerator(val_x, val_y)

# Load and Tweak Pre-trained Model
# Loads the VGG19 Model without the last 2 FC layers when include_top=False
base_model = keras.applications.VGG19(input_shape=IMG_SHAPE, include_top=False, weights='imagenet')

x = base_model.output
x = keras.layers.Flatten()(x)
predictions = keras.layers.Dense(NUM_CLASSES, activation='softmax')(x)
model = keras.Model(inputs=base_model.input, outputs=predictions)
for layer in base_model.layers:
    layer.trainable = False

model.compile(loss='categorical_crossentropy', optimizer='adam', metrics=['accuracy'])
model.summary()

# Train Model
start = time.time()
model.fit_generator(generator=training_generator,
                    # validation_data=validation_generator,
                    epochs=10)
end = time.time()

print("Time taken : {:.3f}sec".format(end - start))


# Make Predictions on test data
df = pd.read_csv("./Machine Learning/HackerEarth_Garden_Nerd_Flower_Recognition/data/test.csv")
df['filename'] = './Machine Learning/HackerEarth_Garden_Nerd_Flower_Recognition/data/test/' + df['image_id'].astype(str) + '.jpg'

pred_y = []
batch_x = []
for index, row in df.iterrows():
    pil_image = keras.preprocessing.image.load_img(row['filename'], target_size=(IMG_SIZE, IMG_SIZE))
    image_array = keras.preprocessing.image.img_to_array(pil_image)
    batch_x.append(image_array)

    if len(batch_x) >= BATCH_SIZE or index == len(df) - 1:
        batch_y = model.predict_on_batch(np.array(batch_x))
        batch_y = np.argmax(batch_y, axis=1) + 1
        pred_y.extend(batch_y)
        batch_x = []


df['category'] = pred_y
df.to_csv("./Machine Learning/HackerEarth_Garden_Nerd_Flower_Recognition/data/prediction.csv", index=False)
