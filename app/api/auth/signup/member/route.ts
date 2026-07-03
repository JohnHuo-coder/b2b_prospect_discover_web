import { errorResponse, jsonResponse } from "@/lib/api/response";
import "@/lib/firebase/firebase.js";
import userRepository from "@/server/repositories/userRepository.js";
import { getAuth } from "firebase-admin/auth";

type SignupError = Error & { code?: string };

export async function POST(request: Request) {
  let uid: string | undefined;
  let dbUserCreated = false;

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return errorResponse("Email and password are required");
    }

    const userRecord = await getAuth().createUser({ email, password });
    uid = userRecord.uid;

    const user = await userRepository.createUser({
      uid,
      email,
      role: "pending",
    });
    dbUserCreated = true;

    const customToken = await getAuth().createCustomToken(uid);

    return jsonResponse(
      {
        message: "Member created successfully",
        user,
        customToken,
      },
      201
    );
  } catch (error) {
    if (uid) {
      await getAuth().deleteUser(uid).catch(() => {});
      if (dbUserCreated) {
        await userRepository.deleteByUid(uid).catch(() => {});
      }
    }

    console.error("Member signup error:", error);

    const err = error as SignupError;
    if (err.code === "auth/email-already-exists") {
      return errorResponse("Email already in use");
    }
    if (err.code === "23505" || err.code === "ER_DUP_ENTRY") {
      return errorResponse("Email already in use");
    }

    return errorResponse("Internal server error", 500);
  }
}
