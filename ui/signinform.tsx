import LoadingSpinner from "../components/loadingSpinner";

interface SigninFormProps {
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  isSubmitting: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  username: string;
  password: string;
}

export default function SigninForm({
  setUsername,
  setPassword,
  isSubmitting,
  handleSubmit,
  username,
  password,
}: SigninFormProps) {
  return (
    <div className="w-full max-w-md card-surface rounded-xl p-5 sm:p-6 shadow-sm">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-semibold">Sign in Required</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div>
          <label
            htmlFor="username"
            className="block text-xs sm:text-sm muted-text mb-1.5"
          >
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            inputMode="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border px-3 py-2.5  text-sm sm:text-base"
            placeholder="Enter your username"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs sm:text-sm muted-text mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            inputMode="text"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border text-sm sm:text-base"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full h-11 sm:h-10 rounded-lg font-medium disabled:opacity-70 cursor-pointer flex items-center justify-center`}
          style={{ backgroundColor: "var(--btn-bg)", color: "var(--btn-text)" }}
        >
          {isSubmitting ? (
            <span className="inline-flex items-center justify-center gap-2">
              <LoadingSpinner />
              <span>Signing in...</span>
            </span>
          ) : (
            "Sign in"
          )}
        </button>
      </form>
    </div>
  );
}