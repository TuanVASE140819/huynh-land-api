const admin = require("../config/firebase");
const db = admin.firestore();
const usersCollection = db.collection("users");

exports.getAllUsers = async () => {
  try {
    const snapshot = await usersCollection.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error in user.service.getAllUsers:", err);
    throw err;
  }
};

exports.getUserById = async (uid) => {
  try {
    const doc = await usersCollection.doc(uid).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  } catch (err) {
    console.error("Error in user.service.getUserById:", err);
    throw err;
  }
};

exports.createUser = async (data) => {
  try {
    const docRef = await usersCollection.add(data);
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() };
  } catch (err) {
    console.error("Error in user.service.createUser:", err);
    throw err;
  }
};

exports.updateUser = async (uid, data) => {
  try {
    await usersCollection.doc(uid).update(data);
    const doc = await usersCollection.doc(uid).get();
    return { id: doc.id, ...doc.data() };
  } catch (err) {
    console.error("Error in user.service.updateUser:", err);
    throw err;
  }
};

exports.deleteUser = async (uid) => {
  try {
    await usersCollection.doc(uid).delete();
  } catch (err) {
    console.error("Error in user.service.deleteUser:", err);
    throw err;
  }
};
