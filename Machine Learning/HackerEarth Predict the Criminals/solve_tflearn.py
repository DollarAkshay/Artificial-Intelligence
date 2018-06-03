import os

import numpy as np
import pandas as pd
import tflearn
from tflearn.data_utils import load_csv
from tflearn.layers.core import input_data, dropout, fully_connected
from tflearn.layers.estimator import regression
from tflearn.layers.normalization import local_response_normalization, batch_normalization


# Global Variables
DIR_NAME = os.path.dirname(__file__)
TF_LOG_PATH = os.path.join(DIR_NAME, 'data\\TFLogs')
BATCH_SIZE = 512

# Data loading and preprocessing
X, Y = load_csv(os.path.join(DIR_NAME, 'data\\criminal_train.csv'), columns_to_ignore=[], categorical_labels=True, n_classes=2)
X_test, Y_test = load_csv(os.path.join(DIR_NAME, 'data\\criminal_test.csv'), columns_to_ignore=[], categorical_labels=True, n_classes=2)
SHAPE = [None, len(X[0])]

print("Shape of input data : ", np.shape(X))
print("Shape of output data : ", np.shape(Y))

# Deep Neural Network
network = input_data(shape=SHAPE, name='input')
network = fully_connected(network, 128, activation='sigmoid', name='fc_1')
network = fully_connected(network, 64, activation='relu', name='fc_1')
network = dropout(network, 0.5, name='drop_1')
network = fully_connected(network, 16, activation='relu', name='fc_2')
network = dropout(network, 0.5, name='drop_2')
network = fully_connected(network, 4, activation='relu', name='fc_3')
network = fully_connected(network, 2, activation='softmax', name='fc_4')
network = regression(network, name='output', loss='mean_square')

# Training
tflearn.init_graph(num_cores=4, gpu_memory_fraction=0.5)
model = tflearn.DNN(network, tensorboard_verbose=3, tensorboard_dir=TF_LOG_PATH)
model.fit({'input': X}, {'output': Y}, n_epoch=1, validation_set=0.1, batch_size=BATCH_SIZE, snapshot_step=500, show_metric=True, run_id='Predict_Criminal')

X_test = X[: 100]

Y_test = model.predict({'input': X_test})

X_test = np.array(X_test)
Y_test = np.array(Y_test)

dfdict = {}
dfdict['PERID'] = X_test[:, 0]
dfdict['Criminal'] = np.argmax(Y_test, axis=1)
dfdict['Criminal_0'] = Y_test[:, 0]
dfdict['Criminal_1'] = Y_test[:, 1]
df = pd.DataFrame(dfdict)
print(df.head(10))
df.to_csv(os.path.join(DIR_NAME, 'data\\prediction.csv'), index=False, columns=['PERID', 'Criminal', 'Criminal_0', 'Criminal_1'])
