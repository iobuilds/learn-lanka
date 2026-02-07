import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff, User, School, MapPin, Calendar, ArrowLeft, ArrowRight, Check, FileText, Info, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Step = 'phone' | 'otp' | 'details';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<Step>('phone');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form data
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [address, setAddress] = useState('');
  const [grade, setGrade] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Check if coming from login with verified phone
  useEffect(() => {
    const state = location.state as { phone?: string; otpVerified?: boolean } | null;
    if (state?.phone && state?.otpVerified) {
      setPhone(state.phone);
      setStep('details');
    }
  }, [location.state]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || phone.length < 9) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone, purpose: 'REGISTER' }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('OTP sent successfully!');
        setStep('otp');
      } else {
        throw new Error(data.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      toast.error(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { phone, otp, purpose: 'REGISTER' }
      });

      if (error) throw error;

      if (data.success && data.verified) {
        if (data.userExists) {
          toast.info('Account already exists. Please login.');
          navigate('/login');
        } else {
          setStep('details');
        }
      } else {
        throw new Error(data.error || 'Invalid OTP');
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      toast.error(error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    
    try {
      // Format phone for email-like signup
      const formattedPhone = phone.replace(/\D/g, '');
      const phoneEmail = `${formattedPhone}@phone.ictacademy.lk`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: phoneEmail,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: formattedPhone,
            school_name: schoolName,
            birthday,
            address,
            grade: parseInt(grade),
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update profile with additional info
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: firstName,
            last_name: lastName,
            phone: formattedPhone,
            school_name: schoolName,
            birthday,
            address,
            grade: parseInt(grade),
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }

        toast.success('Account created successfully!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone, purpose: 'REGISTER' }
      });

      if (error) throw error;
      toast.success('OTP resent successfully!');
    } catch (error: any) {
      toast.error('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {['phone', 'otp', 'details'].map((s, index) => (
        <div key={s} className="flex items-center">
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step === s 
                ? 'bg-primary text-white' 
                : index < ['phone', 'otp', 'details'].indexOf(step)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-300 text-gray-600'
            }`}
          >
            {index < ['phone', 'otp', 'details'].indexOf(step) ? (
              <Check className="w-4 h-4" />
            ) : (
              index + 1
            )}
          </div>
          {index < 2 && (
            <div className={`w-8 h-0.5 mx-1 ${
              index < ['phone', 'otp', 'details'].indexOf(step)
                ? 'bg-green-500'
                : 'bg-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center px-4 py-8 gap-8">
        {/* Left Side - Branding */}
        <div className="text-center lg:text-left lg:flex-1 lg:max-w-lg">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">ictfromabc</h1>
          <p className="text-gray-300 text-sm md:text-base">
            ලංකාවේ විශාලතම පොරගනුදු තාක්ෂණ පන්තිය
          </p>
          <p className="text-gray-400 text-sm">
            ගණකාංජේ බැඳිම <span className="text-white">A</span> සහ <span className="text-white">B</span> සාමාන්‍ය අභිත
          </p>
        </div>

        {/* Right Side - Register Form */}
        <div className="w-full max-w-md">
          <div className="bg-gray-100 rounded-lg p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Create Account
            </h2>
            <p className="text-sm text-gray-500 text-center mb-4">
              {step === 'phone' && 'Enter your phone number to get started'}
              {step === 'otp' && 'Enter the OTP sent to your phone'}
              {step === 'details' && 'Complete your profile'}
            </p>

            {renderStepIndicator()}

            {/* Step 1: Phone */}
            {step === 'phone' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="07X XXX XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-white border-gray-300"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-gray-700">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="bg-white border-gray-300 text-center text-xl tracking-[0.5em] font-mono"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 text-center">
                    OTP sent to {phone}. Expires in 5 minutes.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setStep('phone')}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>

                <button 
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="w-full text-sm text-blue-600 hover:text-blue-700"
                >
                  Resend OTP
                </button>
              </form>
            )}

            {/* Step 3: Details */}
            {step === 'details' && (
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="firstName" className="text-gray-700 text-sm">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-white border-gray-300"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lastName" className="text-gray-700 text-sm">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-white border-gray-300"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="schoolName" className="text-gray-700 text-sm">School Name</Label>
                  <Input
                    id="schoolName"
                    type="text"
                    placeholder="Your school name"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="bg-white border-gray-300"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="birthday" className="text-gray-700 text-sm">Birthday</Label>
                    <Input
                      id="birthday"
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="bg-white border-gray-300"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="grade" className="text-gray-700 text-sm">Grade</Label>
                    <Select value={grade} onValueChange={setGrade} required>
                      <SelectTrigger className="bg-white border-gray-300">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {[6, 7, 8, 9, 10, 11, 12, 13].map((g) => (
                          <SelectItem key={g} value={g.toString()}>
                            Grade {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="address" className="text-gray-700 text-sm">Address</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Your address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="bg-white border-gray-300"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-gray-700 text-sm">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white border-gray-300 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-gray-700 text-sm">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white border-gray-300"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            )}

            {/* Login Link */}
            <div className="mt-4 text-center">
              <p className="text-gray-600 text-sm">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="text-blue-600 font-medium hover:text-blue-700"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 px-4">
        {/* Social Links */}
        <div className="flex justify-center gap-6 mb-4">
          <a href="#" className="text-red-500 hover:text-red-400 transition-colors">
            <Youtube className="w-8 h-8" />
          </a>
          <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
          </a>
          <a href="#" className="text-blue-600 hover:text-blue-500 transition-colors">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
        </div>

        {/* Copyright */}
        <p className="text-center text-gray-400 text-sm mb-4">
          ©2025. All rights reserved.
        </p>

        {/* Bottom Buttons */}
        <div className="flex justify-center gap-4">
          <Link to="/past-papers">
            <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
              <FileText className="w-4 h-4 mr-2" />
              Past Papers
            </Button>
          </Link>
          <Link to="/about">
            <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
              <Info className="w-4 h-4 mr-2" />
              About Us
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Register;
