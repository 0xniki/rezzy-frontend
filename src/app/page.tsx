"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Tab } from '@headlessui/react';
import HoursSetup from '@/components/HoursSetup';
import TablesSetup from '@/components/TableSetup';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Home() {
  const [setup, setSetup] = useState<boolean>(false);

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold mb-6">restaurant setup</h1>
      
      {!setup ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl mb-4">welcome to rezzy</h2>
            <p className="mb-6 text-gray-600">let's set up your restaurant layout and hours</p>
            <button
              onClick={() => setSetup(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              start setup
            </button>
          </div>
        </div>
      ) : (
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
            </Tab.Panels>
          </Tab.Group>
          
          <div className="mt-6 flex justify-end">
            <Link
              href="/dashboard"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              finish setup
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
