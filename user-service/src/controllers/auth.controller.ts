import { Request, Response } from "express";
import { supabase } from "../lib/supabase";

// ─────────────────────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────────────────────
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email dan password wajib diisi" });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({ error: "Email atau password salah" });
      return;
    }

    // Ambil data terbaru dari tabel profil kita
    const { data: userData } = await supabase
      .from("users")
      .select("role, poin, membership_expiry")
      .eq("id", data.user.id)
      .single();

    res.json({
      data: {
        token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: userData?.role ?? "customer",
          poin: userData?.poin ?? 0,
          membership_expiry: userData?.membership_expiry ?? null,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Terjadi kesalahan internal saat login" });
  }
}

// ─────────────────────────────────────────────────────────
// GET /auth/me
// ─────────────────────────────────────────────────────────
export async function getMe(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Akses ditolak. Token tidak valid." });
      return;
    }

    const token = authHeader.split(" ")[1];
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res
        .status(401)
        .json({ error: "Sesi telah berakhir, silakan login kembali." });
      return;
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, poin, membership_expiry")
      .eq("id", data.user.id)
      .single();

    if (userError || !userData) {
      res
        .status(404)
        .json({ error: "Profil pengguna tidak ditemukan di sistem." });
      return;
    }

    res.json({
      data: {
        id: data.user.id,
        email: data.user.email,
        role: userData.role,
        poin: userData.poin,
        membership_expiry: userData.membership_expiry,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Terjadi kesalahan saat memvalidasi sesi" });
  }
}
