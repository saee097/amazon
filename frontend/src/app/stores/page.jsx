"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import {
FiArrowRight,
FiClock,
FiExternalLink,
FiMapPin,
FiNavigation,
FiPhone,
FiShoppingBag,
FiStar,
} from "react-icons/fi";
import { ChevronRight } from "lucide-react";

const stores = [
{
id: "karachi",
city: "Karachi",
area: "Clifton",
address: "123 Fashion Street, Clifton, Karachi",
hours: "10:00 AM - 10:00 PM",
phone: "+92 300 1234567",
rating: "4.8",
reviews: 124,
status: "Open today",
distance: "2.4 km",
coordinates: {
  lat: 24.8138,
  lng: 67.0305,
},
services: [
  "Personal Styling",
  "Alterations & Tailoring",
  "Gift Wrapping",
  "Click & Collect",
],
},

{
id: "lahore",
city: "Lahore",
area: "Gulberg",
address: "45 Mall Road, Gulberg, Lahore",
hours: "10:00 AM - 10:00 PM",
phone: "+92 300 7654321",
rating: "4.9",
reviews: 186,
status: "Open today",
distance: "1.8 km",
coordinates: {
  lat: 31.5204,
  lng: 74.3587,
},
services: [
  "Personal Styling",
  "Alterations & Tailoring",
  "Gift Wrapping",
  "Click & Collect",
],
},

{
id: "islamabad",
city: "Islamabad",
area: "F-8",
address: "78 Jinnah Avenue, F-8, Islamabad",
hours: "10:00 AM - 9:00 PM",
phone: "+92 300 9876543",
rating: "4.7",
reviews: 98,
status: "Open today",
distance: "3.1 km",
coordinates: {
  lat: 33.6971,
  lng: 73.0166,
},
services: [
  "Personal Styling",
  "Gift Wrapping",
  "Click & Collect",
  "Private Shopping",
],
},
];

const services = [
{
title: "Personal Styling",
description:
"Get help choosing the right products for your style.",
},

{
title: "Alterations & Tailoring",
description:
"Selected stores offer professional fitting services.",
},

{
title: "Gift Wrapping",
description:
"Make your purchase ready to give with our gift service.",
},

{
title: "Click & Collect",
description:
"Order online and conveniently collect from your store.",
},
];

export default function StoresPage() {
const [selectedId, setSelectedId] = useState(stores[0].id);
const [mapError, setMapError] = useState(false);

const mapRef = useRef(null);
const mapInstanceRef = useRef(null);
const markersRef = useRef([]);

const selectedStore = useMemo(
() =>
stores.find((store) => store.id === selectedId) ??
stores[0],
[selectedId]
);

/*

* Google Maps URL
  */
  const getDirectionsUrl = (address) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
   address
      )}`;

/*

* Initialize Google Maps
  */
  useEffect(() => {
  let isMounted = true;


const initializeMap = async () => {

  try {
    const apiKey =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error(
        "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing."
      );

      if (isMounted) {
        setMapError(true);
      }

      return;
    }

    setOptions({
      apiKey,
      version: "weekly",
    });

    const [maps, markerLibrary] = await Promise.all([
      importLibrary("maps"),
      importLibrary("marker"),
    ]);

    if (!isMounted || !mapRef.current) return;

    /*
     * Create map
     */
    const map = new maps.Map(mapRef.current, {
      center: selectedStore.coordinates,
      zoom: 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      clickableIcons: true,
      gestureHandling: "greedy",
      styles: [
        {
          featureType: "poi.business",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    mapInstanceRef.current = map;

    /*
     * Create markers
     */
    markersRef.current = stores.map((store) => {
      const marker = new markerLibrary.Marker({
        position: store.coordinates,
        map,
        title: `${store.city} Store`,
        animation: null,
      });

      marker.addListener("click", () => {
        setSelectedId(store.id);

        map.panTo(store.coordinates);

        if (map.getZoom() < 12) {
          map.setZoom(12);
        }
      });

      return marker;
    });

    /*
     * Fit all stores inside map
     */
    const lats = stores.map((s) => s.coordinates.lat);
    const lngs = stores.map((s) => s.coordinates.lng);
    map.setCenter({
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    });
    map.setZoom(5);
  } catch (error) {
    console.error("Google Maps initialization failed:", error);

    if (isMounted) {
      setMapError(true);
    }
  }
};

initializeMap();

return () => {
  isMounted = false;

  markersRef.current.forEach((marker) => {
    marker.setMap(null);
  });

  markersRef.current = [];
  mapInstanceRef.current = null;
};

}, []);

useEffect(() => {
  if (!mapInstanceRef.current || !selectedStore) {
    return;
  }

  const map = mapInstanceRef.current;

  map.panTo(selectedStore.coordinates);

  map.setZoom(13);

  /*
   * Update marker animations
   */
  markersRef.current.forEach((marker, index) => {
    const store = stores[index];

    if (store.id === selectedStore.id) {
      marker.setAnimation(window.google?.maps?.Animation?.BOUNCE);
    } else {
      marker.setAnimation(null);
    }
  });
}, [selectedStore]);

return ( <main className="min-h-screen bg-gray-50">
{/* =====================================================
HERO
====================================================== */}

  <section className="border-b border-gray-200 bg-white">
<div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">      {/* Breadcrumb */}

      <nav
        aria-label="Breadcrumb"
           className="mb-4 flex items-center gap-1.5 text-sm"
      >
        <Link
          href="/"
           className="font-medium text-gray-700"
        >
          Home
        </Link>

        <ChevronRight className="h-4 w-4 text-gray-400" />

        <span className="font-medium text-gray-700">
          Store Locator
        </span>
      </nav>

      <div className="max-w-2xl">
         <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-[#0F766E]/15 bg-[#0F766E]/5 px-3 py-1 text-[12px] font-medium text-[#0F766E]">
          <FiMapPin size={13} />

          Visit us in person
        </div>

  <h1 className="text-2xl font-semibold leading-[1.08] tracking-[-0.03em] text-gray-700 sm:text-3xl lg:text-[40px]">          Find a store near you
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
          Visit one of our stores to explore our latest
          collection, get personalized assistance, and enjoy
          convenient in-store services.
        </p>
      </div>
    </div>
  </section>

  {/* =====================================================
      MAIN CONTENT
  ====================================================== */}

  <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
      {/* =================================================
          STORE LIST
      ================================================== */}

      <div className="lg:col-span-5">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {/* Header */}

          <div className="border-b border-gray-200 px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-700">
                  Our stores
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {stores.length} locations available
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
                <FiShoppingBag size={17} />
              </div>
            </div>
          </div>

          {/* Stores */}

          <div className="divide-y divide-gray-100">
            {stores.map((store) => {
              const isSelected =
                selectedId === store.id;

              return (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(store.id);

                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.panTo(
                        store.coordinates
                      );

                      mapInstanceRef.current.setZoom(13);
                    }
                  }}
                  aria-pressed={isSelected}
                  className={`group w-full text-left transition-all duration-200 ${
                    isSelected
                      ? "bg-[#0F766E]/5"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}

                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          isSelected
                            ? "bg-[#0F766E] text-white"
                            : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                        }`}
                      >
                        <FiMapPin size={19} />
                      </div>

                      {/* Content */}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3
                              className={`text-sm font-semibold ${
                                isSelected
                                  ? "text-[#0F766E]"
                                  : "text-gray-700"
                              }`}
                            >
                              {store.city}
                            </h3>

                            <p className="mt-0.5 text-xs font-medium text-gray-500">
                              {store.area}
                            </p>
                          </div>

                          {isSelected && (
                            <span className="shrink-0 rounded-full bg-[#0F766E]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#0F766E]">
                              Selected
                            </span>
                          )}
                        </div>

                        <p className="mt-3 text-xs leading-5 text-gray-500">
                          {store.address}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-gray-500">
                          <span className="inline-flex items-center gap-1.5">
                            <FiClock size={13} />

                            {store.hours}
                          </span>

                          <span className="inline-flex items-center gap-1.5 text-green-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />

                            {store.status}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-1.5">
                          <FiStar
                            className="fill-current text-amber-400"
                            size={13}
                          />

                          <span className="text-xs font-semibold text-gray-700">
                            {store.rating}
                          </span>

                          <span className="text-xs text-gray-400">
                            ({store.reviews} reviews)
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}

                      <FiArrowRight
                        className={`mt-1 shrink-0 transition-all ${
                          isSelected
                            ? "translate-x-0 text-[#0F766E]"
                            : "-translate-x-1 text-gray-300 group-hover:translate-x-0 group-hover:text-gray-500"
                        }`}
                        size={17}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =================================================
          MAP + DETAILS
      ================================================== */}

      <div className="space-y-6 lg:col-span-7">
        {/* =================================================
            LIVE GOOGLE MAP
        ================================================== */}

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="relative h-[320px] overflow-hidden sm:h-[380px]">
            {/* Actual Google Map */}

            <div
              ref={mapRef}
              className="absolute inset-0 h-full w-full"
            />

            {/* Loading / Error State */}

            {mapError && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-100 px-6">
                <div className="max-w-sm text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0F766E]/10 text-[#0F766E]">
                    <FiMapPin size={21} />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-gray-700">
                    Map unavailable
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    Please configure your Google Maps API key
                    to display the live store map.
                  </p>

                  <a
                    href={getDirectionsUrl(
                      selectedStore.address
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0b625c]"
                  >
                    <FiNavigation size={14} />

                    Open in Google Maps

                    <FiExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}

            {/* Map Controls */}

            <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between gap-3 sm:left-5 sm:right-5 sm:top-5">
              <div className="rounded-xl border border-white/80 bg-white/95 px-4 py-3 backdrop-blur">
                <p className="text-xs font-semibold text-gray-700">
                  Store locations
                </p>

                <p className="mt-0.5 text-[11px] text-gray-500">
                  Select a location to view it on the map
                </p>
              </div>

              <a
                href={getDirectionsUrl(
                  selectedStore.address
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-[#0F766E]/30 hover:text-[#0F766E]"
              >
                <FiNavigation size={14} />

                Directions

                <FiExternalLink size={12} />
              </a>
            </div>

            {/* Selected Location */}

            <div className="absolute bottom-4 left-4 right-4 z-10 sm:bottom-5 sm:left-5 sm:right-5">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-white/80 bg-white/95 px-4 py-3 backdrop-blur">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    Selected location
                  </p>

                  <p className="truncate text-xs font-semibold text-gray-700">
                    {selectedStore.address}
                  </p>
                </div>

                <span className="hidden shrink-0 text-xs text-gray-500 sm:block">
                  {selectedStore.distance} away
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            SELECTED STORE DETAILS
        ================================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-500" />

                {selectedStore.status}
              </div>

              <h2 className="text-xl font-semibold tracking-tight text-gray-700">
                {selectedStore.city} Store
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {selectedStore.area}
              </p>
            </div>

            {/* Rating */}

            <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2">
              <FiStar
                className="fill-current text-amber-400"
                size={14}
              />

              <span className="text-xs font-semibold text-gray-700">
                {selectedStore.rating}
              </span>

              <span className="text-xs text-gray-400">
                ({selectedStore.reviews})
              </span>
            </div>
          </div>

          {/* Information Grid */}

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">
            {/* Address */}

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <FiMapPin size={15} />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700">
                  Address
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {selectedStore.address}
                </p>
              </div>
            </div>

            {/* Hours */}

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <FiClock size={15} />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700">
                  Opening hours
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {selectedStore.hours}
                </p>
              </div>
            </div>

            {/* Phone */}

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <FiPhone size={15} />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700">
                  Phone
                </p>

                <a
                  href={`tel:${selectedStore.phone.replace(
                    /\s/g,
                    ""
                  )}`}
                  className="mt-1 block text-xs text-gray-500 transition hover:text-[#0F766E]"
                >
                  {selectedStore.phone}
                </a>
              </div>
            </div>

            {/* Distance */}

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <FiNavigation size={15} />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700">
                  Distance
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Approximately {selectedStore.distance}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={getDirectionsUrl(
                selectedStore.address
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-4 py-3 text-xs font-semibold text-white transition hover:bg-[#0b625c] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
            >
              <FiNavigation size={15} />

              Get Directions

              <FiExternalLink size={12} />
            </a>

            <a
              href={`tel:${selectedStore.phone.replace(
                /\s/g,
                ""
              )}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <FiPhone size={15} />

              Call Store
            </a>
          </div>
        </div>
      </div>
    </div>

   

 
  </section>
</main>


);
}
