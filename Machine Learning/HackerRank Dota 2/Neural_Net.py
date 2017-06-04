import datetime
import os
import random
import traceback

import numpy as np
import tensorflow as tf
#
#
#
def generateHeroIndices(filepath):
    herosList = []
    lines = open(filepath).read().split("\n")

    for line in lines:
        words = line.split(",")
        for word in words[:-1]:
            if word not in herosList:
                herosList.append(word)
    herosList.sort()
    heroIndex = {k: v for v, k in enumerate(herosList)}

    return herosList, heroIndex
#
#
def getData(filepath, startLine, endLine):

    data = []
    labels = []
    lines = open(filepath).read().split("\n")
    for line in lines[startLine:endLine]:
        words = line.split(",")
        labels.append(np.eye(2)[int(words[-1])-1])
        heroNormalized = np.zeros(2*heroCount)
        for i, word in enumerate(words[:-1]):
            if i<5:
                heroNormalized[heroIndex[word]] = 1
            else:
                heroNormalized[heroIndex[word]+heroCount] = 1
        data.append(heroNormalized)

    return data, labels

#
#
def relu(x):
    return tf.nn.relu(x)
#
#
def neural_network_model():
    
    # Weights
    with tf.name_scope('Weights'):
        # Variables
        weights_fc1 = tf.Variable(tf.random_normal([input_features, 256]), name="Weights_FC1")
        weights_fc2 = tf.Variable(tf.random_normal([256, 512]), name="Weights_FC2")
        weights_fc3 = tf.Variable(tf.random_normal([512, 256]), name="Weights_FC3")
        weights_fc4 = tf.Variable(tf.random_normal([256, 64]), name="Weights_FC4")
        weights_fc5 = tf.Variable(tf.random_normal([64, 16]), name="Weights_FC5")
        weights_out = tf.Variable(tf.random_normal([16, output_features]), name="Weights_Out")
        # Summaries
        tf.summary.histogram('Weights FC1', weights_fc1)
        tf.summary.histogram('Weights FC2', weights_fc2)
        tf.summary.histogram('Weights FC3', weights_fc3)
        tf.summary.histogram('Weights FC4', weights_fc4)
        tf.summary.histogram('Weights FC5', weights_fc5)
        tf.summary.histogram('Weights Out', weights_out)

    # Biases
    with tf.name_scope('Biases'):
        # Variables  
        biases_fc1 = tf.Variable(tf.random_normal([256]), name="Biases_FC1")
        biases_fc2 = tf.Variable(tf.random_normal([512]), name="Biases_FC2")
        biases_fc3 = tf.Variable(tf.random_normal([256]), name="Biases_FC3")
        biases_fc4 = tf.Variable(tf.random_normal([64]), name="Biases_FC4")
        biases_fc5 = tf.Variable(tf.random_normal([16]), name="Biases_FC5")
        biases_out = tf.Variable(tf.random_normal([output_features]), name="Biases_Out")
        # Summaries
        tf.summary.histogram('Biases FC1', biases_fc1)
        tf.summary.histogram('Biases FC2', biases_fc2)
        tf.summary.histogram('Biases FC3', biases_fc3)
        tf.summary.histogram('Biases FC4', biases_fc4)
        tf.summary.histogram('Biases FC5', biases_fc5)
        tf.summary.histogram('Biases Out', biases_out)

    # Neural Network
    with tf.name_scope('Layer_1'):
        layer1 = tf.add( tf.matmul(input_placeholder, weights_fc1), biases_fc1)
        relu1 = relu(layer1)
    with tf.name_scope('Layer_2'):
        layer2 = tf.add( tf.matmul(relu1, weights_fc2), biases_fc2)
        relu2 = relu(layer2)
    with tf.name_scope('Layer_3'):
        layer3 = tf.add( tf.matmul(relu2, weights_fc3), biases_fc3)
        relu3 = relu(layer3)
    with tf.name_scope('Layer_4'):
        layer4 = tf.add( tf.matmul(relu3, weights_fc4), biases_fc4)
        relu4 = relu(layer4)
    with tf.name_scope('Layer_5'):
        layer5 = tf.add( tf.matmul(relu4, weights_fc5), biases_fc5)
        relu5 = relu(layer5)
    with tf.name_scope('Output_Layer'):
        output = tf.add( tf.matmul(relu5, weights_out), biases_out)
        output = tf.reshape(output , shape=[-1, output_features])
        return output
#
#
def train_model():

    global global_step
    
    saver = tf.train.Saver()
    merged_summary = tf.summary.merge_all()
    with tf.Session() as sess :
        if os.path.isfile(os.path.join(LOG_DIR, 'latest-model.ckpt.index')):
            saver.restore(sess, os.path.join(LOG_DIR, 'latest-model.ckpt'))
            print("\nTrained Model restored")
        else:
            sess.run(tf.global_variables_initializer())
            print("\nNew Model Initialized")
        summary_writer = tf.summary.FileWriter(os.path.join(LOG_DIR, 'TensorBoard/'+datetime.datetime.now().strftime("%b %d,  %I-%M-%S %p")))
        summary_writer.add_graph(sess.graph)
        
        # Train Neural Net
        print("\nTraining Neural Net ....")
        try :
            ephocs = 20
            for epoch in range(ephocs):
                epoch_loss = 0
                for i in range(0, len(train_data), BATCH_SIZE):
                    train_batch_data = train_data[i:i+BATCH_SIZE]
                    train_batch_labels = train_labels[i:i+BATCH_SIZE]
                    _, l = sess.run([optimizer, loss], feed_dict={input_placeholder: train_batch_data, output_placeholder: train_batch_labels} )
                    epoch_loss += l
                print("Epoch", epoch+1,"completed with a cost of", epoch_loss)
                # Write summary every epoch
                if epoch%10==0:
                    save_path = saver.save(sess, os.path.join(LOG_DIR, 'TensorBoard/model.ckpt'))
                if epoch%1==0:
                    for i in range(0, len(train_data), BATCH_SIZE):
                        train_batch_data = train_data[i:i+BATCH_SIZE]
                        train_batch_labels = train_labels[i:i+BATCH_SIZE]
                        batch_summary= sess.run(merged_summary, feed_dict={input_placeholder: train_batch_data, output_placeholder: train_batch_labels} )
                        summary_writer.add_summary(batch_summary, global_step)
                        global_step+=1
                        summary_writer.flush()
                        epoch_loss += l

        except KeyboardInterrupt:
            print("\nKeyboard Interrupt")
        except Exception as e:
            print("\nUnknown Exception")
            print(traceback.format_exc())
            print(str(e))
        finally:
            save_path = saver.save(sess, os.path.join(LOG_DIR, 'latest-model.ckpt'))
            print("Saving Model in %s ...." % save_path)
            summary_writer.close()
#
#
def predict_model():

    saver = tf.train.Saver()
    with tf.Session() as sess :
        saver.restore(sess, os.path.join(LOG_DIR, 'latest-model.ckpt'))
        print("Trained Model restored")
        
        # Predict Test Data
        try :
            print("\nPredicting Test Data ....")
            # Get Predicted Test labels
            labels = []
            acc_array = []
            for i in range(0, len(test_data), BATCH_SIZE):
                test_batch_data = test_data[i:i+BATCH_SIZE]
                test_batch_labels = test_labels[i:i+BATCH_SIZE]
                predicted_batch_labels, batch_acc = sess.run([test_prediction, accuracy], feed_dict={input_placeholder: test_batch_data, output_placeholder: test_batch_labels} )
                predicted_batch_labels = test_prediction.eval(feed_dict={input_placeholder : test_batch_data})
                labels.extend(predicted_batch_labels)
                acc_array.append(100*batch_acc*len(test_data))

            # Check Accuracy
            print("Printing Incorrect Predictions")
            correct = 0
            char_correct = 0
            for i, label in enumerate(labels):
                expected_label = np.argmax(test_labels[i])
                if  expected_label != label:
                    print(""+expected_label+"/"+label)
                else:
                    correct+=1
            print("\n\nAccuracy :", 100*correct/len(labels))
            print("\n")
        except KeyboardInterrupt:
            print("\nKeyboard Interrupt")
        except Exception as e:
            print("\nUnknown Exception")
            print(traceback.format_exc())
            print(str(e))
#
#
#


herosList, heroIndex = generateHeroIndices("HackerRank/Dota 2 Game Prediction/Training_Data.txt")
heroCount = len(herosList)

#Train Data
print("\nLoading Training Data ....", end="")
train_data, train_labels = getData("HackerRank/Dota 2 Game Prediction/Training_Data.txt", 0, 14000)
print("Done")

#Test Data
print("\nLoading Testing Data ....", end="")
test_data, test_labels = getData("HackerRank/Dota 2 Game Prediction/Training_Data.txt", 14000, 15000)
print("Done")

global_step = 0
LOG_DIR = "HackerRank/Dota 2 Game Prediction/TensorFlow Logs"
BATCH_SIZE = 128
input_features = 2*heroCount
output_features = 2
with tf.name_scope('Inputs'):
    input_placeholder = tf.placeholder('float', [None, input_features], name='data_input')
    output_placeholder = tf.placeholder('float', [None, output_features], name='label_input')

output_prediction = neural_network_model()

with tf.name_scope('Loss'):
    with tf.name_scope('Cross_Entropy'):
        cross_entropy = tf.nn.softmax_cross_entropy_with_logits(logits=output_prediction, labels=output_placeholder)
    loss = tf.reduce_mean( cross_entropy)
    tf.summary.scalar("Loss Graph", loss)
with tf.name_scope('Trainer'):
    trainer = tf.train.AdamOptimizer()
with tf.name_scope('Optimizer'):
    optimizer = trainer.minimize(loss)
with tf.name_scope('Prediction'):
    test_prediction = tf.argmax(output_prediction, 1)
with tf.name_scope('Accuracy'):
    correct_prediction = tf.equal(tf.argmax(output_prediction, 1), tf.argmax(output_placeholder, 1))
    accuracy = tf.reduce_mean(tf.cast(correct_prediction, tf.float32))
    tf.summary.scalar("Accuracy Graph", accuracy)

train_model()

predict_model()

