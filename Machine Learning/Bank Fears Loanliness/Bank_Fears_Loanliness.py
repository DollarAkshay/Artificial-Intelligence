import pandas
import numpy as np
import tensorflow as tf

hashmap = {}

# 
# Convert text data into numericals
def preprocess(file):
    # Loan Term
    file.loc[file["term"] == "36 months", "term"] = 36
    file.loc[file["term"] == "60 months", "term"] = 60

    # Employment Year
    file.loc[file["emp_length"] == "n/a", "emp_length"] = 0
    file.loc[file["emp_length"] == "< 1 year", "emp_length"] = 0.5
    file.loc[file["emp_length"] == "1 year", "emp_length"] = 1
    for i in range(2, 10):
        file.loc[file["emp_length"] == str(i)+" years", "emp_length"] = i
    file.loc[file["emp_length"] == "10+ years", "emp_length"] = 10

    # Sub Grade
    col = 'sub_grade'
    list_val = file[col].unique()
    for val in list_val:
        if col in hashmap and val in hashmap[col]:
            mean_val = hashmap[col][val]
        else :
            mean_val = file.loc[ file[col] == val, "loan_status"].mean()
            if col not in hashmap:
                hashmap[col] = {}
            hashmap[col][val] = mean_val
        file.loc[file[col] == val, col] = mean_val


    # Homeowner Ship
    col = 'home_ownership'
    list_val = file[col].unique()
    for val in list_val:
        if col in hashmap and val in hashmap[col]:
            mean_val = hashmap[col][val]
        else :
            mean_val = file.loc[ file[col] == val, "loan_status"].mean()
            if col not in hashmap:
                hashmap[col] = {}
            hashmap[col][val] = mean_val
        file.loc[file[col] == val, col] = mean_val


    # Verification Status
    col = 'verification_status'
    list_val = file[col].unique()
    for val in list_val:
        if col in hashmap and val in hashmap[col]:
            mean_val = hashmap[col][val]
        else :
            mean_val = file.loc[ file[col] == val, "loan_status"].mean()
            if col not in hashmap:
                hashmap[col] = {}
            hashmap[col][val] = mean_val
        file.loc[file[col] == val, col] = mean_val
    

    # Payment Plan
    col = 'pymnt_plan'
    list_val = file[col].unique()
    for val in list_val:
        if col in hashmap and val in hashmap[col]:
            mean_val = hashmap[col][val]
        else :
            mean_val = file.loc[ file[col] == val, "loan_status"].mean()
            if col not in hashmap:
                hashmap[col] = {}
            hashmap[col][val] = mean_val
        file.loc[file[col] == val, col] = mean_val

    
    # Purpose
    col = 'purpose'
    list_val = file[col].unique()
    for val in list_val:
        if col in hashmap and val in hashmap[col]:
            mean_val = hashmap[col][val]
        else :
            mean_val = file.loc[ file[col] == val, "loan_status"].mean()
            if col not in hashmap:
                hashmap[col] = {}
            hashmap[col][val] = mean_val
        file.loc[file[col] == val, col] = mean_val


    # State
    col = 'addr_state'
    list_val = file[col].unique()
    for val in list_val:
        if col in hashmap and val in hashmap[col]:
            mean_val = hashmap[col][val]
        else :
            mean_val = file.loc[ file[col] == val, "loan_status"].mean()
            if col not in hashmap:
                hashmap[col] = {}
            hashmap[col][val] = mean_val
        file.loc[file[col] == val, col] = mean_val


    # Application Type
    col = 'application_type'
    list_val = file[col].unique()
    for val in list_val:
        if col in hashmap and val in hashmap[col]:
            mean_val = hashmap[col][val]
        else :
            mean_val = file.loc[ file[col] == val, "loan_status"].mean()
            if col not in hashmap:
                hashmap[col] = {}
            hashmap[col][val] = mean_val
        file.loc[file[col] == val, col] = mean_val

    return file  
#
#Neural Network Modelu
def neural_network_model():

    nodes = [25, 25]
    weights = {
        'hidden1' : tf.Variable( tf.random_normal([ip_features, nodes[0]]) ),
        'hidden2' : tf.Variable( tf.random_normal([nodes[0], nodes[1]]) ),
        'out' : tf.Variable( tf.random_normal([nodes[1], op_classes]) )
    }

    biases = {
        'hidden1' : tf.Variable( tf.random_normal([ nodes[0]]) ),
        'hidden2' : tf.Variable( tf.random_normal([nodes[1]]) ),
        'out' : tf.Variable( tf.random_normal([op_classes]) )
    }

    hidden1 = tf.add( tf.matmul(input_placeholder, weights['hidden1']), biases['hidden1'] )
    hidden1 = tf.nn.sigmoid(hidden1)

    hidden2 = tf.add( tf.matmul(hidden1, weights['hidden2']), biases['hidden2'] )
    hidden2 = tf.nn.sigmoid(hidden2)

    output = tf.add( tf.matmul(hidden2, weights['out']), biases['out'] )
    output = tf.nn.softmax(output)
    return output


#
# Train and Predict
def train_and_predict():
    
    output_prediction = neural_network_model()
    loss = tf.reduce_sum(tf.square(output_prediction - output_placeholder))
    trainer = tf.train.AdamOptimizer()
    optimizer = trainer.minimize(loss)
    test_prediction = tf.arg_max(output_prediction, 1)

    ephocs = 5

    with tf.Session() as sess :
        sess.run(tf.global_variables_initializer())

        for epoch in range(ephocs):
            epoch_cost = 0;
            i = 0
            while i<len(train_x):
                start = i
                end = i+batch_size
                batch_x = np.array( train_x[start:end] )
                batch_y = np.array( train_y[start:end])

                _, c = sess.run([optimizer, loss], feed_dict={input_placeholder: batch_x, output_placeholder: batch_y} )
                epoch_cost += c
                i+=batch_size
            print("Epoch",epoch+1,"completed with a cost of", epoch_cost)


        predictions = test_prediction.eval( feed_dict={input_placeholder: test_x} )
    return predictions
# 
# Main
print("\nPre-processing...")
data_train = preprocess(pandas.read_csv("Machine Learning/Bank Fears Loanliness/Data/train_indessa.csv"))
data_test = preprocess(pandas.read_csv("Machine Learning/Bank Fears Loanliness/Data/test_indessa.csv"))
print("Done")

features = ['member_id', 'loan_amnt', 'funded_amnt', 'funded_amnt_inv', 
            'term', 'int_rate', 'sub_grade', 'emp_length', 'home_ownership',
            'annual_inc', 'verification_status', 'pymnt_plan', 'purpose',
            'addr_state', 'dti', 'delinq_2yrs', 'inq_last_6mths', 
            'mths_since_last_delinq', 'open_acc', 'pub_rec', 'total_acc',
            'total_rec_int', 'application_type']
ip_features = len(features)
op_classes = 1
batch_size = 128

input_placeholder = tf.placeholder('float', [None, ip_features])
output_placeholder = tf.placeholder('float')

train_x = data_train[features]
train_y = data_train['loan_status']
train_y = np.eye(np.max(train_y) + 1)[train_y]   # Conver to 1 hot Array

print("\nMaking Predictions...")
test_x = data_test[features]
test_y = train_and_predict()
print("Done")

print("\nSaving Prediction...")
data_test = pandas.read_csv("Machine Learning/Bank Fears Loanliness/Data/test_indessa.csv")
submission = pandas.DataFrame({
        "member_id": data_test["member_id"],
        "loan_status": test_y
    })

submission.to_csv("Machine Learning/Bank Fears Loanliness/Data/prediction.csv", index=False)
print("Done")



