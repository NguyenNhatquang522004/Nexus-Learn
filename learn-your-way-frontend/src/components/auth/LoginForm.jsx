import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { login, loginWithGoogle } from '../../../store/slices/authSlice';
import { addToast } from '../../../store/slices/uiSlice';
import { Button, Input, Checkbox, LoadingSpinner } from '../../shared';
import { ROUTES, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../../utils/constants';

const loginSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  rememberMe: Yup.boolean()
});

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      try {
        await dispatch(login(values)).unwrap();
        dispatch(addToast({
          message: SUCCESS_MESSAGES.LOGIN,
          type: 'success'
        }));
        navigate(ROUTES.DASHBOARD);
      } catch (err) {
        dispatch(addToast({
          message: err || ERROR_MESSAGES.AUTH_ERROR,
          type: 'error'
        }));
      }
    }
  });

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await dispatch(loginWithGoogle(credentialResponse.credential)).unwrap();
      dispatch(addToast({
        message: SUCCESS_MESSAGES.LOGIN,
        type: 'success'
      }));
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      dispatch(addToast({
        message: err || ERROR_MESSAGES.AUTH_ERROR,
        type: 'error'
      }));
    }
  };

  const handleGoogleError = () => {
    dispatch(addToast({
      message: 'Google sign-in failed. Please try again.',
      type: 'error'
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-hard p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-neutral-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-neutral-600">
            Sign in to continue your learning journey
          </p>
        </div>

        {import.meta.env.VITE_ENABLE_GOOGLE_OAUTH === 'true' && (
          <div className="mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              width="100%"
            />
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-neutral-500">
                  Or continue with email
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && formik.errors.email}
            icon={<FiMail />}
            required
          />

          <div>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Enter your password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && formik.errors.password}
              icon={<FiLock />}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-neutral-400 hover:text-neutral-600"
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <Checkbox
              name="rememberMe"
              label="Remember me"
              checked={formik.values.rememberMe}
              onChange={formik.handleChange}
            />
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="text-sm font-medium text-primary-500 hover:text-primary-600"
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-error-50 border border-error-200"
            >
              <p className="text-sm text-error-700">{error}</p>
            </motion.div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={isLoading || !formik.isValid}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            Don't have an account?{' '}
            <Link
              to={ROUTES.SIGNUP}
              className="font-medium text-primary-500 hover:text-primary-600"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginForm;
