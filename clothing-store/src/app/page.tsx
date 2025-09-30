'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import ConfigNotification from '@/components/ui/ConfigNotification';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center py-4">
            <h1 className="text-xl font-medium text-gray-900">ClothingStore POS</h1>
          </div>
        </div>
      </header>

      {/* Configuration Notification */}
      <div className="max-w-4xl mx-auto px-6 pt-4">
        <ConfigNotification />
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-3xl font-light text-gray-900 mb-4">
            ClothingStore POS
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Point-of-sale system for clothing stores
          </p>
        </div>

        {/* Authentication Options */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 max-w-lg mx-auto">
          {/* Customer Section */}
          <div className="border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Customer
            </h3>
            <div className="space-y-3">
              <Link href="/auth/customer/login" className="block">
                <Button className="w-full">
                  Login
                </Button>
              </Link>
              <Link href="/auth/customer/register" className="block">
                <Button variant="outline" className="w-full">
                  Register
                </Button>
              </Link>
            </div>
          </div>

          {/* Owner Section */}
          <div className="border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Owner
            </h3>
            <Link href="/auth/owner/login" className="block">
              <Button className="w-full">
                Login
              </Button>
            </Link>
            <p className="mt-3 text-sm text-gray-500">
              Admin-created accounts only
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
