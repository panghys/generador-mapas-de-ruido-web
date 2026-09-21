import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import {
  findOrCreateGoogleUser_,
  findUserByMail_,
  createUser_,
} from "../persintence/repository/user.repository.js";

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

export async function register(req, res) {
  const { name, mail, password } = req.body;

  try {
    const existingUser = await findUserByMail_(mail);

    if (existingUser) {
      return res.status(400).json({
        status: false,
        error: "El correo ya está registrado",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser_({
      name,
      mail,
      password: hashedPassword,
    });

    const token = jwt.sign(
      {
        id: user.id,
        mail: user.mail,
        admin: user.admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      status: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      error: error.message,
    });
  }
}

export async function login(req, res) {
  const { mail, password } = req.body;

  try {
    const user = await findUserByMail_(mail);

    if (!user) {
      return res.status(400).json({
        status: false,
        error: "Correo o contraseña incorrectos",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        status: false,
        error: "Esta cuenta utiliza inicio de sesión con Google",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({
        status: false,
        error: "Correo o contraseña incorrectos",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        mail: user.mail,
        admin: user.admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      status: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      error: error.message,
    });
  }
}