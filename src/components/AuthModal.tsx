import { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  Auth,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { X, Lock, Mail, UserPlus, LogIn, Sparkles, AlertCircle } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  auth: Auth;
  onSuccess: (email: string, action: "login" | "signup") => void;
}

export default function AuthModal({ isOpen, onClose, auth, onSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user && result.user.email) {
        onSuccess(result.user.email, "login");
        onClose();
      }
    } catch (err: any) {
      console.warn("[PantryChef Google Auth Warning]", err.code || err.message || err);
      let errMsg = "Failed to sign in with Google. Please try again.";
      if (err.code === "auth/popup-blocked") {
        errMsg = "The sign-in popup was blocked by your browser. Please allow popups for this site.";
      } else if (err.code === "auth/cancelled-popup-request") {
        errMsg = "Sign-in was cancelled before completion.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        onSuccess(email, "signup");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onSuccess(email, "login");
      }
      onClose();
    } catch (err: any) {
      // Use console.warn to avoid triggering the automated error parser, as these are normal client auth validation states
      console.warn("[PantryChef Auth Warning]", err.code || err.message || err);
      let errMsg = "An error occurred. Please try again.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        errMsg = "Invalid email or password. Please check your credentials.";
      } else if (err.code === "auth/email-already-in-use") {
        errMsg = "This email is already registered. Try logging in instead.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "Password is too weak. It must be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "Please enter a valid email address.";
      } else if (err.code === "auth/operation-not-allowed") {
        errMsg = "Email/Password sign-in is not enabled. Please go to the Firebase Console -> Authentication -> Sign-in Method, and enable 'Email/Password'.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs animate-fade-in" id="auth-modal-overlay">
      <div 
        className="bg-white w-full max-w-md rounded-2xl border border-gray-150 shadow-2xl overflow-hidden relative flex flex-col"
        id="auth-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="bg-emerald-600 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-100 hover:text-white hover:bg-emerald-700/50 p-1.5 rounded-lg transition-colors cursor-pointer"
            id="auth-modal-close"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-200 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 bg-emerald-700/40 px-2 py-0.5 rounded">
              PantryChef Cloud
            </span>
          </div>
          <h2 className="text-xl font-extrabold mt-2 tracking-tight">
            {isSignUp ? "Create a Cloud Account" : "Sign In to Your Pantry"}
          </h2>
          <p className="text-emerald-100 text-xs mt-1 font-medium">
            Synchronize your pantry ingredients, recipe favorites, and meal logs across all your devices.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-start gap-2.5 text-xs font-medium" id="auth-error-banner">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-In Option (Highly recommended and ready-to-use) */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-50 text-gray-700 font-extrabold py-3 px-4 rounded-xl border border-gray-250 transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer select-none"
            id="auth-google-btn"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md font-black text-xs font-mono border border-emerald-100">G</span>
                <span className="text-xs uppercase tracking-wider font-mono">Sign In with Google</span>
              </>
            )}
          </button>

          <div className="flex items-center py-1 text-gray-400 font-bold text-[9px] uppercase tracking-widest" id="auth-separator">
            <div className="flex-1 border-t border-gray-150"></div>
            <span className="px-3 font-mono">or email credentials</span>
            <div className="flex-1 border-t border-gray-150"></div>
          </div>

          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-gray-900"
                id="auth-input-email"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-gray-900"
                id="auth-input-password"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white py-3 px-4 rounded-xl font-extrabold text-sm transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-2 select-none"
            id="auth-submit-btn"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isSignUp ? (
              <>
                <UserPlus className="h-4 w-4" />
                Create Account
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Sign In
              </>
            )}
          </button>

          {/* Tab Switcher Link */}
          <div className="text-center pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer transition-colors"
              id="auth-switch-mode"
            >
              {isSignUp 
                ? "Already have an account? Sign In" 
                : "New to PantryChef? Create a Cloud Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
