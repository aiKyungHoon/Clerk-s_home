import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBwRLokWVQ9it--vfEKRoijtv3NrKeaQUI",
  authDomain: "clerk-s-home.firebaseapp.com",
  projectId: "clerk-s-home",
  storageBucket: "clerk-s-home.firebasestorage.app",
  messagingSenderId: "16406607304",
  appId: "1:16406607304:web:9bfad0f91f84e8e7eabcfd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const admins = [
  { email: "admin@clerk.com", name: "admin", role: "super", region: "전체", password: "adminpassword12" },
  { email: "leecy@clerk.com", name: "이찬영 청년회장님", role: "super", region: "전체", password: "leecypassword12" },
  { email: "kimhk@clerk.com", name: "김현경 청년총무님", role: "super", region: "전체", password: "kimhkpassword12" },
  { email: "leehj@clerk.com", name: "이현주 청년서기님", role: "super", region: "전체", password: "leehjpassword12" },
  { email: "hanyj@clerk.com", name: "한예지 청년심방과장", role: "super", region: "전체", password: "hanyjpassword12" },
  { email: "kimkh@clerk.com", name: "김경훈 관리자", role: "super", region: "전체", password: "kimkhpassword12" }
];

async function createAccounts() {
  console.log("Starting account creation...");
  for (const admin of admins) {
    try {
      console.log(`Creating user in Auth: ${admin.email}`);
      const userCred = await createUserWithEmailAndPassword(auth, admin.email, admin.password);
      
      console.log(`Creating profile in Firestore: ${admin.name}`);
      await setDoc(doc(db, "clerks", String(userCred.user.uid)), {
        id: admin.email,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        region: admin.region,
        uid: userCred.user.uid
      });
      console.log(`Successfully created ${admin.name}!`);
      
      // Sign out to allow the next user creation
      await signOut(auth);
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        console.log(`User ${admin.email} already exists.`);
      } else {
        console.error(`Error creating ${admin.email}:`, error.message);
      }
    }
  }
  console.log("Account creation complete!");
  process.exit(0);
}

createAccounts();
