"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser } from "@/lib/api/auth";
import { isApiError } from "@/lib/api/client";
import { saveAuthSession } from "@/lib/auth/session";
import { labelStyle, inputBaseStyle } from "@/lib/customCss/customCss";

const MIN_PASSWORD_LENGTH = 8;

const WristbandModel = dynamic(
  () => import("@/components/hero/WristbandModel"),
  {
    ssr: false,
    loading: () => null,
  },
);

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const successMessage = registered
    ? "Account created. Sign in with your email and password."
    : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [eyeHovered, setEyeHovered] = useState(false);
  const [forgotHovered, setForgotHovered] = useState(false);
  const [submitHovered, setSubmitHovered] = useState(false);
  const [submitPressed, setSubmitPressed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [flashVisible, setFlashVisible] = useState(false);
  const [panelFadingOut, setPanelFadingOut] = useState(false);
  const [googleHovered, setGoogleHovered] = useState(false);
  const [appleHovered, setAppleHovered] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setSubmitting(true);

    try {
      const data = await loginUser({ email: email.trim(), password });
      saveAuthSession(data.email, data.token);
      setPanelFadingOut(true);
      setFlashVisible(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 520);
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message);
      } else if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError("Unable to sign in. Please try again.");
      }
      setSubmitting(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#080808",
        color: "#F0EDE8",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Mono:wght@300;400&display=swap');
        :root {
          --font-display: "Playfair Display", serif;
          --font-mono: "DM Mono", ui-monospace, monospace;
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.22; }
          40% { opacity: 1; }
        }
        @keyframes flashPulse {
          0% { opacity: 0; }
          35% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          opacity: 0.28,
        }}
      >
        <WristbandModel />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(8,8,8,0.74)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 3,
          minHeight: "100vh",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        <section
          style={{
            background: "#050505",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 56px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                display: "grid",
                placeItems: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  border: "1px solid rgba(255,255,255,0.2)",
                  animation: "spinSlow 18s linear infinite",
                }}
              />
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 2L5 5.5V10.8C5 16 8.6 20.8 12 22C15.4 20.8 19 16 19 10.8V5.5L12 2Z"
                  stroke="#CC2233"
                  strokeWidth="1.6"
                />
              </svg>
            </div>

            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 15,
                letterSpacing: "0.25em",
                color: "rgba(240,237,232,0.86)",
              }}
            >
              THE SURAKSHA
            </div>

            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "rgba(255,255,255,0.28)",
              }}
            >
              Wear it. Trust it. Stay safe.
            </div>
          </div>

          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 1,
              background: "rgba(255,255,255,0.06)",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 24,
              bottom: 18,
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: "rgba(255,255,255,0.18)",
              letterSpacing: "0.02em",
            }}
          >
            © 2025 Suraksha Safety Pvt. Ltd.
          </div>
        </section>

        <section
          style={{
            background: "#080808",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 52px",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 380,
              opacity: panelFadingOut ? 0 : 1,
              transform: panelFadingOut ? "translateY(-8px)" : "translateY(0)",
              transition:
                "opacity 0.6s cubic-bezier(.16,1,.3,1), transform 0.6s cubic-bezier(.16,1,.3,1)",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: 36,
                fontWeight: 500,
                color: "#F0EDE8",
                marginBottom: 6,
              }}
            >
              Sign in
            </h1>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "rgba(255,255,255,0.35)",
                marginBottom: 40,
              }}
            >
              Welcome back.
            </p>

            {successMessage ? (
              <p
                style={{
                  margin: "0 0 16px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "rgba(204,34,51,0.9)",
                  lineHeight: 1.5,
                }}
              >
                {successMessage}
              </p>
            ) : null}

            {error ? (
              <p
                role="alert"
                style={{
                  margin: "0 0 20px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "#E74C3C",
                  lineHeight: 1.5,
                }}
              >
                {error}
              </p>
            ) : null}

            <form onSubmit={onSubmit} style={{ margin: 0 }}>
              <div style={{ marginBottom: 24 }}>
                <label
                  htmlFor="login-email"
                  style={labelStyle(emailFocused || email.length > 0)}
                >
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  autoComplete="email"
                  required
                  style={inputBaseStyle(emailFocused)}
                />
              </div>

              <div style={{ marginBottom: 18, position: "relative" }}>
                <label
                  htmlFor="login-password"
                  style={labelStyle(passwordFocused || password.length > 0)}
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  autoComplete="current-password"
                  required
                  style={{
                    ...inputBaseStyle(passwordFocused),
                    paddingRight: 28,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  onMouseEnter={() => setEyeHovered(true)}
                  onMouseLeave={() => setEyeHovered(false)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: 0,
                    bottom: 10,
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    margin: 0,
                    cursor: "pointer",
                    color: eyeHovered
                      ? "rgba(255,255,255,0.7)"
                      : "rgba(255,255,255,0.3)",
                    transition: "color 0.2s ease",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3.2"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                  </svg>
                </button>
              </div>

              <div style={{ textAlign: "right", marginBottom: 24 }}>
                <a
                  href="#"
                  onMouseEnter={() => setForgotHovered(true)}
                  onMouseLeave={() => setForgotHovered(false)}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.28)",
                    textDecoration: forgotHovered ? "underline" : "none",
                    textUnderlineOffset: "2px",
                  }}
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={submitting}
                onMouseEnter={() => setSubmitHovered(true)}
                onMouseLeave={() => {
                  setSubmitHovered(false);
                  setSubmitPressed(false);
                }}
                onMouseDown={() => setSubmitPressed(true)}
                onMouseUp={() => setSubmitPressed(false)}
                style={{
                  width: "100%",
                  height: 46,
                  border: "none",
                  borderRadius: 0,
                  background: submitHovered ? "#AA1122" : "#CC2233",
                  color: "#ffffff",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  cursor: submitting ? "default" : "pointer",
                  transform: submitPressed
                    ? "translateY(0)"
                    : submitHovered
                      ? "translateY(-1px)"
                      : "translateY(0)",
                  transition: "background 0.25s ease, transform 0.25s ease",
                  marginBottom: 18,
                }}
              >
                {submitting ? (
                  <span aria-label="loading">
                    <span
                      style={{
                        animation: "dotPulse 0.9s infinite",
                        animationDelay: "0s",
                      }}
                    >
                      ·
                    </span>
                    <span
                      style={{
                        margin: "0 8px",
                        animation: "dotPulse 0.9s infinite",
                        animationDelay: "0.15s",
                      }}
                    >
                      ·
                    </span>
                    <span
                      style={{
                        animation: "dotPulse 0.9s infinite",
                        animationDelay: "0.3s",
                      }}
                    >
                      ·
                    </span>
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>

              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: 20,
                }}
              >
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  style={{ color: "#CC2233", textDecoration: "none" }}
                >
                  Create one
                </Link>
              </div>

              <div
                style={{
                  width: "100%",
                  height: 1,
                  background: "rgba(255,255,255,0.1)",
                  marginBottom: 14,
                }}
              />

              <div
                style={{
                  textAlign: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  color: "rgba(255,255,255,0.33)",
                  marginBottom: 14,
                }}
              >
                OR CONTINUE WITH
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onMouseEnter={() => setGoogleHovered(true)}
                  onMouseLeave={() => setGoogleHovered(false)}
                  style={{
                    width: 42,
                    height: 42,
                    border: `1px solid ${googleHovered ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.1)"}`,
                    background: "transparent",
                    borderRadius: 0,
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M21.8 12.2C21.8 11.5 21.7 10.9 21.6 10.3H12V14.1H17.5C17.2 15.4 16.4 16.5 15.2 17.2V19.6H18.4C20.3 17.9 21.8 15.3 21.8 12.2Z"
                      fill="#fff"
                    />
                    <path
                      d="M12 22C14.8 22 17.1 21.1 18.4 19.6L15.2 17.2C14.3 17.8 13.3 18.2 12 18.2C9.3 18.2 7 16.4 6.2 14H2.9V16.5C4.3 19.7 7.9 22 12 22Z"
                      fill="#fff"
                    />
                    <path
                      d="M6.2 14C5.8 12.9 5.8 11.7 6.2 10.6V8.1H2.9C1.7 10.6 1.7 13.4 2.9 15.9L6.2 14Z"
                      fill="#fff"
                    />
                    <path
                      d="M12 6.4C13.4 6.4 14.6 6.9 15.5 7.7L18.5 4.7C17 3.3 14.9 2.4 12 2.4C7.9 2.4 4.3 4.7 2.9 8L6.2 10.6C7 8.2 9.3 6.4 12 6.4Z"
                      fill="#fff"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  onMouseEnter={() => setAppleHovered(true)}
                  onMouseLeave={() => setAppleHovered(false)}
                  style={{
                    width: 42,
                    height: 42,
                    border: `1px solid ${appleHovered ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.1)"}`,
                    background: "transparent",
                    borderRadius: 0,
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M16.6 12.6C16.6 10.9 18 10.1 18.1 10C17.3 8.8 16 8.7 15.5 8.7C14.3 8.5 13.1 9.4 12.5 9.4C11.9 9.4 10.9 8.7 9.9 8.7C8.5 8.8 7.2 9.5 6.4 10.8C4.8 13.5 6 17.4 7.5 19.5C8.2 20.5 9 21.6 10.1 21.6C11.2 21.5 11.6 20.9 12.9 20.9C14.1 20.9 14.5 21.6 15.7 21.6C16.9 21.6 17.6 20.6 18.3 19.6C19.1 18.5 19.4 17.4 19.4 17.4C19.4 17.3 16.6 16.2 16.6 12.6Z"
                      fill="#fff"
                    />
                    <path
                      d="M14.8 7.2C15.4 6.5 15.8 5.6 15.7 4.7C14.8 4.7 13.8 5.3 13.2 6C12.7 6.6 12.2 7.5 12.4 8.4C13.4 8.5 14.3 7.9 14.8 7.2Z"
                      fill="#fff"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      {flashVisible ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(204,34,51,0.06)",
            zIndex: 20,
            pointerEvents: "none",
            animation: "flashPulse 0.45s ease",
          }}
        />
      ) : null}
    </main>
  );
}
