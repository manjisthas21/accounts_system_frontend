export default function AuthLayout({ children }) {
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      {children}
    </div>
  );
}