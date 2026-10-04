// Login / register sheet. Log in → straight to the map. Create account → the sheet grows into onboarding.
const AUTH_NS = window.JustMateDesignSystem_dee067;

function AuthSheet({ mode, setMode, onLogin, onRegister }) {
  const { Segmented, Button } = AUTH_NS;
  const [email, setEmail] = React.useState("alex@example.com");
  const [pw, setPw] = React.useState("walkfast");
  const login = mode === "login";
  const ok = /\S+@\S+\.\S+/.test(email) && pw.length >= 6;
  const go = () => ok && (login ? onLogin() : onRegister());
  return (
    <div style={{ padding: "20px 20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
      <Segmented items={[{ value: "login", label: "Log in" }, { value: "register", label: "Create account" }]} value={mode} onChange={setMode} />
      <TextField label="email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" onEnter={go} />
      <TextField label="password" type="password" value={pw} onChange={setPw} placeholder="6 characters or more" onEnter={go} />
      <Button fullWidth disabled={!ok} onClick={go} trailingIcon={login ? undefined : "arrow-right"}>{login ? "Log in" : "Create account"}</Button>
      <div key={mode} style={{ animation: "jm-fade var(--dur-snappy) ease", display: "flex", justifyContent: "center" }}>
        {login
          ? <Button variant="ghost" size="sm">Forgot password</Button>
          : <span className="t-footnote" style={{ textAlign: "center", padding: "0 12px", textWrap: "pretty" }}>Next: a faceless profile. Two minutes, no photos of you shown to anyone.</span>}
      </div>
    </div>
  );
}
Object.assign(window, { AuthSheet });
