import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { findOrCreateGoogleUser_ } from "../persintence/repository/user.repository.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function googleLogin(req, res) {
  const { credential } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name } = payload;

    const user = await findOrCreateGoogleUser_({
      providerid: sub,
      mail: email,
      name,
    });

    const token = jwt.sign(
      { id: user.id, mail: user.mail, admin: user.admin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ status: true, data: { user, token } });
  } catch (error) {
    res.status(400).json({ status: false, error: error.message });
  }
}