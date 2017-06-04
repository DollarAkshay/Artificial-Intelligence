import pandas
import numpy as np
import tflearn

hashmap = {}

# 
# Convert text data into numericals
def preprocess(file):
    
    file.fillna(0, inplace=True)

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
# Main
print("\nPre-processing...")
data_train = pandas.read_csv("Machine Learning/Bank Fears Loanliness/Data/train_indessa.csv")
data_train = preprocess(data_train)

data_test = pandas.read_csv("Machine Learning/Bank Fears Loanliness/Data/test_indessa.csv")
data_test = preprocess(data_test)
print("Done")

features = ['loan_amnt', 'funded_amnt', 'funded_amnt_inv', 
            'term', 'int_rate', 'sub_grade', 'emp_length', 'home_ownership',
            'annual_inc', 'verification_status', 'purpose',
            'addr_state', 'dti', 'delinq_2yrs', 'inq_last_6mths', 
            'mths_since_last_delinq', 'open_acc', 'pub_rec', 'total_acc',
            'total_rec_int', 'application_type']

ip_features = len(features)
op_classes = 2
batch_size = 512

train_x = data_train[features].values
train_y = data_train['loan_status'].values
train_y = np.eye(np.max(train_y) + 1)[train_y] 
test_x = data_test[features].values
test_y = []

# Build neural network
net = tflearn.input_data(shape=[None, ip_features])
net = tflearn.fully_connected(net, 128)
net = tflearn.fully_connected(net, 64)
net = tflearn.fully_connected(net, 32)
net = tflearn.fully_connected(net, 16)
net = tflearn.fully_connected(net, op_classes, activation='softmax')
net = tflearn.regression(net)

# Define model
model = tflearn.DNN(net)
# Start training (apply gradient descent algorithm)
model.fit(train_x, train_y, n_epoch=5, batch_size=batch_size, show_metric=True)

#Predict
test_y = model.predict(test_x)
test_y = [ row[1] for row in test_y]
# Save to File
print("\nSaving Prediction...")
data_test = pandas.read_csv("Machine Learning/Bank Fears Loanliness/Data/test_indessa.csv")
submission = pandas.DataFrame({
        "member_id": data_test["member_id"],
        "loan_status": test_y
    })

submission.to_csv("Machine Learning/Bank Fears Loanliness/Data/prediction.csv", index=False, columns=["member_id", "loan_status"])
print("Done")



