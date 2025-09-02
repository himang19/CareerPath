// controllers/authController.js
import {User} from "../models/user.model.js";
import jwt from "jsonwebtoken";
import axios from "axios";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// STEP 1: Redirect user to Google OAuth
export const googleLogin = (req, res) => {
  console.log("hello");
  const redirectUri = "http://localhost:8000/api/v1/auth/google/callback";
  const clientId = process.env.GOOGLE_CLIENT_ID;

  // frontend se role bhejna
  const { role } = req.query; // ?role=student OR ?role=recruiter

const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20profile%20email&state=${role}&prompt=consent`;
console.log(`url is ${url}`);
  res.redirect(url);
  console.log("done");
};

// STEP 2: Handle callback from Google
export const googleCallback = async (req, res) => {
  const code = req.query.code;
  const roleFromState = req.query.state; // yaha role aa gaya

  try {
    // 1. Exchange code for tokens
    const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: "http://localhost:8000/api/v1/auth/google/callback",
      grant_type: "authorization_code",
    });

    const { access_token, id_token } = tokenResponse.data;

    // 2. Verify ID Token (JWT signature check)
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // 3. Get latest user info (optional, for updated profile pic/name)
    const googleUser = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { email: freshEmail, name: freshName, picture: freshPic } = googleUser.data;

    // final user data (fresh data prefer karo)
    console.log(`email from token  is ${email}   and    freshemil by hittingh api is ${freshEmail}`);
    const finalEmail = freshEmail || email;
    const finalName = freshName || name;
    const finalPic = freshPic || picture;

    // 4. Check if user exists in DB
    let user = await User.findOne({ email: finalEmail });

    if (!user) {
      // naya user create karo aur role state se le lo
      user = await User.create({
        email: finalEmail,
        fullname: finalName,
        profile:{
                profilePhoto:finalPic || null,
            },
        role: roleFromState || null,
      });
    }

  if(user?.role !== roleFromState){
  return res.redirect(`${process.env.FRONTEND_URL}?error=role_mismatch`);
}


    // 5. Agar role missing tha aur frontend se nahi aaya
    if (!user.role) {
      return res.json({
        message: "Role selection required",
        userId: user._id,
      });
    }

    // 6. JWT generate karke bhejo
const tokenData = {
            userId: user._id
        }
        const token = await jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '1d' });

        console.log("tojen is",token);
res.cookie("token", token, {
 maxAge: 1 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "strict",
});

console.log("allllllllllll settttttttttttttt");
    res.redirect(`${process.env.FRONTEND_URL}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Google login failed" });
  }
};

// STEP 3: Set role manually (agar user ne baad mei select kiya ho)
export const setRole = async (req, res) => {
  const { userId, role } = req.body;

  try {
    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ error: "Role setting failed" });
  }
};