import { errorResponse, jsonResponse } from "@/lib/api/response";
import "@/lib/firebase/firebase.js";
import userRepository from "@/server/repositories/userRepository.js";
import { getAuth } from "firebase-admin/auth";
import { mapSignupError } from "@/lib/auth/mapSignupError";

export async function POST(request: Request) {
  let uid: string | undefined;
  let dbUserCreated = false;

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return errorResponse("Email and password are required");
    }

    if (password.length < 6) {
      return errorResponse("Password must be at least 6 characters");
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

    const mapped = mapSignupError(error);
    return errorResponse(mapped.message, mapped.status);
  }
}
