const clubsparkLocations = [
  {
    name: "Clissold Park",
    url: "https://clubspark.lta.org.uk/ClissoldParkHackney/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["North", "East"],
    lat: 51.5599,
    lng: -0.0821
  },
  {
    name: "Battersea Park",
    url: "https://clubspark.lta.org.uk/BatterseaParkTennisCourts/Booking/BookByDate#?role=guest",
    bookingWindow: 2,
    tags: ["West", "South"],
    lat: 51.4786,
    lng: -0.1546
  },
  {
    name: "Archbishops Park",
    url: "https://clubspark.lta.org.uk/archbishopsparklambethnorth/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["Central"],
    lat: 51.4946,
    lng: -0.1189
  },
  {
    name: "Holland Park (Kensington)",
    url: "https://clubspark.lta.org.uk/hollandpark2/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["West"],
    lat: 51.5023,
    lng: -0.2024
  },
  {
    name: "Tanner Street",
    url: "https://clubspark.lta.org.uk/TannerStPark/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["Central", "East"],
    lat: 51.4999,
    lng: -0.0781
  },
  {
    name: "Kennington Park",
    url: "https://clubspark.lta.org.uk/kenningtonpark/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["South", "Central"],
    lat: 51.4857,
    lng: -0.1052
  },
  {
    name: "Geraldine Mary Harmsworth",
    url: "https://clubspark.lta.org.uk/GeraldineMaryHarmsworth/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["South", "Central"],
    lat: 51.4955,
    lng: -0.1017
  },
  {
    name: "Burgess Park",
    url: "https://clubspark.lta.org.uk/BurgessParkSouthwark/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["South"],
    lat: 51.4818,
    lng: -0.0833
  },
  {
    name: "Clapham Common",
    url: "https://clubspark.lta.org.uk/ClaphamCommon/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["South", "West"],
    lat: 51.4619,
    lng: -0.1378
  },
  {
    name: "Southwark Park",
    url: "https://clubspark.lta.org.uk/SouthwarkPark/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["East", "Central"],
    lat: 51.4957,
    lng: -0.0531
  },
  {
    name: "Vauxhall Park",
    url: "https://clubspark.lta.org.uk/VauxhallPark/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["South", "Central"],
    lat: 51.4825,
    lng: -0.1232
  },
  {
    name: "South Park Fulham",
    url: "https://clubspark.lta.org.uk/SouthParkFulham/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["West"],
    lat: 51.4703,
    lng: -0.1996
  },
  {
    name: "Parliament Hill Fields Tennis Courts",
    url: "https://clubspark.lta.org.uk/ParliamentHillFieldsTennisCourts/Booking/BookByDate#?role=guest",
    bookingWindow: 2,
    tags: ["North"],
    lat: 51.5556,
    lng: -0.1523
  },
  {
    name: "Queen's Park Tennis Courts",
    url: "https://clubspark.lta.org.uk/QueensParkTennisCourts/Booking/BookByDate#?role=guest",
    bookingWindow: 2,
    tags: ["North", "West"],
    lat: 51.5341,
    lng: -0.2053
  },
  {
    name: "Finsbury Park",
    url: "https://clubspark.lta.org.uk/FinsburyPark/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["North"],
    lat: 51.5649,
    lng: -0.1065
  },
  {
    name: "Northway Gardens",
    url: "https://clubspark.lta.org.uk/NorthwayGardens/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["North"],
    lat: 51.5606,
    lng: -0.1766
  },
  {
    name: "Dulwich Park",
    url: "https://clubspark.lta.org.uk/DulwichPark/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["South"],
    lat: 51.4449,
    lng: -0.0856
  },
  {
    name: "Ravenscourt Park",
    url: "https://clubspark.lta.org.uk/RavenscourtPark/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["West"],
    lat: 51.4943,
    lng: -0.2326
  },
  {
    name: "Hurlingham Park",
    url: "https://clubspark.lta.org.uk/HurlinghamPark/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["West"],
    lat: 51.4712,
    lng: -0.2040
  },
  {
    name: "Eel Brook Common",
    url: "https://clubspark.lta.org.uk/EelBrookCommon/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["South"],
    lat: 51.4774,
    lng: -0.1927
  },
  {
    name: "Belair Park",
    url: "https://clubspark.lta.org.uk/BelairPark/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["South"],
    lat: 51.4404,
    lng: -0.0837
  },
  {
    name: "Brunswick Park",
    url: "https://clubspark.lta.org.uk/BrunswickPark/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["South", "Central"],
    lat: 51.4921,
    lng: -0.0946
  },
  {
    name: "Larkhall Park",
    url: "https://clubspark.lta.org.uk/larkhallpark/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["South"],
    lat: 51.4799,
    lng: -0.1177
  },
  {
    name: "Avondale Park",
    url: "https://clubspark.lta.org.uk/AvondalePark/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["West"],
    lat: 51.5169,
    lng: -0.2161
  },
  {
    name: "Kensington Memorial Park",
    url: "https://clubspark.lta.org.uk/KensingtonMemorialPark/Booking/BookByDate#?role=guest",
    bookingWindow: 8,
    tags: ["West"],
    lat: 51.4912,
    lng: -0.2189
  }
];

export default clubsparkLocations;