import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const res = await fetch(
        'https://chatapp-blink.onrender.com/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to login');
      }

      // 💥 IMPORTANT FIX: store token manually
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // store user in redux + localStorage (safe for refresh)
      dispatch(setCredentials(data.user));

      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/chat');

    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-cyan-600/10 blur-[150px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel p-8 sm:p-10 max-w-md w-full relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-block text-3xl font-bold neon-text mb-2">
            Blink
          </Link>

          <h2 className="text-2xl font-semibold text-white">Welcome Back</h2>
          <p className="text-slate-400 mt-2">
            Log in to continue to your chats
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={submitHandler} className="space-y-6">

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-button bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-50 font-medium rounded-xl py-3"
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>

        </form>

        <p className="text-center text-slate-400 mt-8 text-sm">
          Don’t have an account?{' '}
          <Link to="/register" className="text-cyan-400">
            Sign up here
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
