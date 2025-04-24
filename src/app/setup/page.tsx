"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tab } from '@headlessui/react';
import HoursSetup from '@/components/HoursSetup';
import TablesSetup from '@/components/TableSetup';
import SpecialHoursSetup from '@/components/SpecialHoursSetup';
import { useRouter } from 'next/navigation';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return <div className="text-center py-4">loading...</div>;
  }

  return (
    <div className="py-6">
      
      <div className="bg-white rounded-lg shadow p-6">
        <Tab.Group>
          <Tab.List className="flex space-x-2 rounded-xl bg-indigo-100 p-1 mb-6">
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  selected
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-indigo-700 hover:bg-indigo-200'
                )
              }
            >
              restaurant hours
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  selected
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-indigo-700 hover:bg-indigo-200'
                )
              }
            >
              tables & layout
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  selected
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-indigo-700 hover:bg-indigo-200'
                )
              }
            >
              special days
            </Tab>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel>
              <div className="p-2">
                <HoursSetup />
              </div>
            </Tab.Panel>
            <Tab.Panel>
              <div className="p-2">
                <TablesSetup />
              </div>
            </Tab.Panel>
            <Tab.Panel>
              <div className="p-2">
                <SpecialHoursSetup />
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
