const admin = require("../config/firebase");

const db = admin.firestore();
const NEWS_COLLECTION = "news";

const NewsService = {
  async getAll(title) {
    let ref = db.collection(NEWS_COLLECTION);
    if (title) {
      ref = ref.where("title", ">=", title).where("title", "<=", title + "\uf8ff");
    }
    const snapshot = await ref.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  async getById(id) {
    const doc = await db.collection(NEWS_COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },
  async create(data) {
    const docRef = await db.collection(NEWS_COLLECTION).add(data);
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() };
  },
  async update(id, data) {
    await db.collection(NEWS_COLLECTION).doc(id).update(data);
    return this.getById(id);
  },
  async delete(id) {
    const doc = await this.getById(id);
    if (!doc) return null;
    await db.collection(NEWS_COLLECTION).doc(id).delete();
    return doc;
  },
  async getLatest() {
    const ref = db.collection(NEWS_COLLECTION).orderBy("date", "desc").limit(1);
    const snapshot = await ref.get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }
};

module.exports = NewsService;
