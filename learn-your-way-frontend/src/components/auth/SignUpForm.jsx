import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiCalendar } from 'react-icons/fi';
import { signUp, loginWithGoogle } from '../../../store/slices/authSlice';
import { addToast } from '../../../store/slices/uiSlice';
import { Button, Input, Checkbox } from '../../shared';
import { ROUTES, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../../utils/constants';
import { validatePassword, checkCOPPACompliance } from '../../../utils/validation';

const signUpSchema = Yup.object({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/\d/, 'Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password'),
  age: Yup.number()
    .min(5, 'You must be at least 5 years old')
    .max(120, 'Please enter a valid age')
    .required('Age is required'),
  parentalConsent: Yup.boolean().when('age', {
    is: (age) => age < parseInt(import.meta.env.VITE_MINIMUM_AGE || '13', 10),
    then: () => Yup.boolean().oneOf([true], 'Parental consent is required for users under 13'),
    otherwise: () => Yup.boolean()
  }),
  termsAccepted: Yup.boolean()
    .oneOf([true], 'You must accept the Terms of Service')
    .required('You must accept the Terms of Service'),
  privacyAccepted: Yup.boolean()
    .oneOf([true], 'You must accept the Privacy Policy')
    .required('You must accept the Privacy Policy')
});

const SignUpForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [coppaCheck, setCoppaCheck] = useState(null);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      age: '',
      parentalConsent: false,
      termsAccepted: false,
      privacyAccepted: false
    },
    validationSchema: signUpSchema,
    onSubmit: async (values) => {
      try {
        await dispatch(signUp({
          name: values.name,
          email: values.email,
          password: values.password,
          age: parseInt(values.age, 10),
          parentalConsent: values.parentalConsent,
          termsAccepted: values.termsAccepted,
          privacyAccepted: values.privacyAccepted
        })).unwrap();
        
        dispatch(addToast({
          message: SUCCESS_MESSAGES.SIGNUP,
          type: 'success'
        }));
        
        navigate(ROUTES.PROFILE_SETUP);
      } catch (err) {
        dispatch(addToast({
          message: err || ERROR_MESSAGES.AUTH_ERROR,
          type: 'error'
        }));
      }
    }
  });

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    formik.handleChange(e);
    
    if (password) {
      const validation = validatePassword(password);
      setPasswordStrength(validation);
    } else {
      setPasswordStrength(null);
    }
  };

  const handleAgeChange = (e) => {
    const age = e.target.value;
    formik.handleChange(e);
    
    if (age) {
      const compliance = checkCOPPACompliance(age);
      setCoppaCheck(compliance);
      
      if (!compliance.isCompliant && !compliance.requiresParentalConsent) {
        formik.setFieldValue('parentalConsent', false);
      }
    } else {
      setCoppaCheck(null);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await dispatch(loginWithGoogle(credentialResponse.credential)).unwrap();
      dispatch(addToast({
        message: SUCCESS_MESSAGES.SIGNUP,
        type: 'success'
      }));
      navigate(ROUTES.PROFILE_SETUP);
    } catch (err) {
      dispatch(addToast({
        message: err || ERROR_MESSAGES.AUTH_ERROR,
        type: 'error'
      }));
    }
  };

  const handleGoogleError = () => {
    dispatch(addToast({
      message: 'Google sign-up failed. Please try again.',
      type: 'error'
    }));
  };

  const getPasswordStrengthColor = () => {
    if (!passwordStrength) return '';
    
    const errorCount = Object.values(passwordStrength.errors).filter(Boolean).length;
    
    if (errorCount === 0) return 'bg-success-500';
    if (errorCount <= 2) return 'bg-warning-500';
    return 'bg-error-500';
  };

  const getPasswordStrengthText = () => {
    if (!passwordStrength) return '';
    
    const errorCount = Object.values(passwordStrength.errors).filter(Boolean).length;
    
    if (errorCount === 0) return 'Strong';
    if (errorCount <= 2) return 'Medium';
    return 'Weak';
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
            Create Your Account
          </h2>
          <p className="text-neutral-600">
            Start your personalized learning journey
          </p>
        </div>

        {import.meta.env.VITE_ENABLE_GOOGLE_OAUTH === 'true' && (
          <div className="mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              text="signup_with"
              shape="rectangular"
              width="100%"
            />
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-neutral-500">
                  Or sign up with email
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-5">
          <Input
            label="Full Name"
            type="text"
            name="name"
            placeholder="Enter your full name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.name && formik.errors.name}
            icon={<FiUser />}
            required
          />

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

          <Input
            label="Age"
            type="number"
            name="age"
            placeholder="Enter your age"
            value={formik.values.age}
            onChange={handleAgeChange}
            onBlur={formik.handleBlur}
            error={formik.touched.age && formik.errors.age}
            icon={<FiCalendar />}
            required
            min="5"
            max="120"
          />

          {coppaCheck && coppaCheck.requiresParentalConsent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 rounded-lg bg-warning-50 border border-warning-200"
            >
              <p className="text-sm text-warning-700 mb-3">
                Because you are under {coppaCheck.minimumAge}, we require parental consent to create an account.
              </p>
              <Checkbox
                name="parentalConsent"
                label="I have parental consent to create this account"
                checked={formik.values.parentalConsent}
                onChange={formik.handleChange}
                error={formik.touched.parentalConsent && formik.errors.parentalConsent}
              />
            </motion.div>
          )}

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Create a password"
              value={formik.values.password}
              onChange={handlePasswordChange}
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

            {passwordStrength && formik.values.password && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${((5 - Object.values(passwordStrength.errors).filter(Boolean).length) / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-neutral-600">
                    {getPasswordStrengthText()}
                  </span>
                </div>
                {Object.keys(passwordStrength.errors).some(key => passwordStrength.errors[key]) && (
                  <ul className="text-xs text-neutral-600 space-y-1">
                    {Object.keys(passwordStrength.errors).map(key => 
                      passwordStrength.errors[key] && (
                        <li key={key} className="flex items-center gap-1">
                          <span className="text-error-500">✕</span>
                          {passwordStrength.messages[key]}
                        </li>
                      )
                    )}
                  </ul>
                )}
              </motion.div>
            )}
          </div>

          <div className="relative">
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.confirmPassword && formik.errors.confirmPassword}
              icon={<FiLock />}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-[38px] text-neutral-400 hover:text-neutral-600"
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <div className="space-y-3">
            <Checkbox
              name="termsAccepted"
              label={
                <span className="text-sm">
                  I agree to the{' '}
                  <a href="/terms" target="_blank" className="text-primary-500 hover:text-primary-600 font-medium">
                    Terms of Service
                  </a>
                </span>
              }
              checked={formik.values.termsAccepted}
              onChange={formik.handleChange}
              error={formik.touched.termsAccepted && formik.errors.termsAccepted}
            />

            <Checkbox
              name="privacyAccepted"
              label={
                <span className="text-sm">
                  I agree to the{' '}
                  <a href="/privacy" target="_blank" className="text-primary-500 hover:text-primary-600 font-medium">
                    Privacy Policy
                  </a>
                </span>
              }
              checked={formik.values.privacyAccepted}
              onChange={formik.handleChange}
              error={formik.touched.privacyAccepted && formik.errors.privacyAccepted}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={isLoading || !formik.isValid || !formik.dirty}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            Already have an account?{' '}
            <Link
              to={ROUTES.LOGIN}
              className="font-medium text-primary-500 hover:text-primary-600"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default SignUpForm;
