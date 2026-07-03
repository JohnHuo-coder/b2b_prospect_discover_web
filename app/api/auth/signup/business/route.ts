import { errorResponse, jsonResponse } from "@/lib/api/response";
import "@/lib/firebase/firebase.js";
import businessRepository from "@/server/repositories/businessRepository.js";
import userRepository from "@/server/repositories/userRepository.js";
import { getAuth } from "firebase-admin/auth";

type SignupError = Error & { code?: string };

export async function POST(request: Request) {
  let uid: string | undefined;
  let dbBusinessCreated = false;
  let dbUserCreated = false;

  try {
    const { business_name, email, password } = await request.json();

    if (!email || !password) {
      return errorResponse("Email and password are required");
    }

    const userRecord = await getAuth().createUser({ email, password });
    uid = userRecord.uid;

    const business = await businessRepository.createBusiness({
      uid,
      business_name,
    });
    dbBusinessCreated = true;

    const user = await userRepository.createUser({
      uid,
      email,
      role: "owner",
      bid: business.bid,
    });
    dbUserCreated = true;

    const customToken = await getAuth().createCustomToken(uid);

    return jsonResponse(
      {
        message: "Business and owner created successfully",
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
      if (dbBusinessCreated) {
        await businessRepository.deleteByUid(uid).catch(() => {});
      }
    }

    console.error("Business signup error:", error);

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
