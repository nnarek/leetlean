// @ts-nocheck
// ---------------------------------------------------------------
// Firebase Firestore implementation of IDatabase.
//
// To use this provider:
//   1. npm install firebase
//   2. Set these env variables:
//        NEXT_PUBLIC_FIREBASE_API_KEY
//        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
//        NEXT_PUBLIC_FIREBASE_PROJECT_ID
//   3. Set NEXT_PUBLIC_DB_PROVIDER=firebase
//
// Firestore collection: "problems"
//   Each document should mirror the Problem type from src/lib/types.ts
//   with fields: slug, title, difficulty, description, starter_code,
//   tags (array), sort_order (number), created_at, updated_at.
// ---------------------------------------------------------------

import type { IDatabase, ProblemsFilter, ProblemsResult } from "./types";
import type { Problem } from "../types";

let _db: any = null;

function getFirestoreDb() {
  if (_db) return _db;

  const { initializeApp, getApps, getApp } = require("firebase/app");
  const { getFirestore } = require("firebase/firestore");

  const app =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });

  _db = getFirestore(app);
  return _db;
}

export class FirebaseDatabase implements IDatabase {
  async getProblems(filter: ProblemsFilter): Promise<ProblemsResult> {
    const {
      collection,
      query: fsQuery,
      where,
      orderBy,
      limit: fsLimit,
      getDocs,
      getCountFromServer,
    } = require("firebase/firestore");

    const db = getFirestoreDb();
    const colRef = collection(db, "problems");

    // Build query constraints
    const constraints: any[] = [];
    if (filter.difficulty) {
      constraints.push(where("difficulty", "==", filter.difficulty));
    }
    if (filter.tag) {
      constraints.push(where("tags", "array-contains", filter.tag));
    }
    constraints.push(orderBy("sort_order", "asc"));

    // Get total count (before pagination)
    const countQuery = fsQuery(colRef, ...constraints);
    const countSnap = await getCountFromServer(countQuery);
    let total = countSnap.data().count;

    // Paginate — Firestore doesn't support offset natively, so we fetch
    // up to (page * limit) and slice. For large datasets consider cursors.
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 10;
    const fetchLimit = page * limit;

    const dataQuery = fsQuery(colRef, ...constraints, fsLimit(fetchLimit));
    const snap = await getDocs(dataQuery);

    let problems: Problem[] = snap.docs.map((d: any) => ({
      id: d.id,
      ...d.data(),
    }));

    // Client-side title search (Firestore doesn't support ILIKE)
    if (filter.q) {
      const lower = filter.q.toLowerCase();
      problems = problems.filter((p) =>
        p.title.toLowerCase().includes(lower)
      );
      total = problems.length;
    }

    // Slice to the requested page
    const from = (page - 1) * limit;
    problems = problems.slice(from, from + limit);

    return { problems, total };
  }

  async getProblemBySlug(slug: string): Promise<Problem | null> {
    const { collection, query: fsQuery, where, getDocs } =
      require("firebase/firestore");

    const db = getFirestoreDb();
    const q = fsQuery(
      collection(db, "problems"),
      where("slug", "==", slug)
    );
    const snap = await getDocs(q);

    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as Problem;
  }

  async getAllTags(): Promise<string[]> {
    const { collection, getDocs } = require("firebase/firestore");

    const db = getFirestoreDb();
    const snap = await getDocs(collection(db, "problems"));
    const s = new Set<string>();
    snap.docs.forEach((d: any) => {
      const tags: string[] = d.data().tags ?? [];
      tags.forEach((t) => s.add(t));
    });
    return Array.from(s).sort();
  }
}
