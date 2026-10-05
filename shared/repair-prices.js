// Typical USD base prices from Service Catalog H/K/N/Q/T. Blank prices stay unavailable.
const PRICES = [
  {
    "code": "SZ-01",
    "unit": "per ring",
    "typical": {
      "14K": 60.0,
      "18K": 72.0,
      "22K": 93.0,
      "24K": 105.0,
      "Platinum": 180.0
    }
  },
  {
    "code": "SZ-02",
    "unit": "per ring",
    "typical": {
      "14K": 70.0,
      "18K": 84.0,
      "22K": 108.5,
      "24K": 122.5,
      "Platinum": 210.0
    }
  },
  {
    "code": "SZ-03",
    "unit": "per ring",
    "typical": {
      "14K": 70.0,
      "18K": 84.0,
      "22K": 108.5,
      "24K": 122.5,
      "Platinum": 210.0
    }
  },
  {
    "code": "SZ-04",
    "unit": "per ring",
    "typical": {
      "14K": 90.0,
      "18K": 108.0,
      "22K": 139.5,
      "24K": 157.5,
      "Platinum": 270.0
    }
  },
  {
    "code": "SZ-05",
    "unit": "per ring",
    "typical": {
      "14K": 175.0,
      "18K": 210.0,
      "22K": 271.25,
      "24K": null,
      "Platinum": 525.0
    }
  },
  {
    "code": "SZ-06",
    "unit": "per ring",
    "typical": {
      "14K": 80.0,
      "18K": 92.0,
      "22K": 108.0,
      "24K": 120.0,
      "Platinum": 160.0
    }
  },
  {
    "code": "SZ-07",
    "unit": "per ring",
    "typical": {
      "14K": 90.0,
      "18K": 108.0,
      "22K": 139.5,
      "24K": null,
      "Platinum": 270.0
    }
  },
  {
    "code": "SZ-08",
    "unit": "per ring",
    "typical": {
      "14K": 30.0,
      "18K": 30.0,
      "22K": 33.0,
      "24K": 34.5,
      "Platinum": 36.0
    }
  },
  {
    "code": "SH-01",
    "unit": "per ring",
    "typical": {
      "14K": 150.0,
      "18K": 180.0,
      "22K": 232.5,
      "24K": 262.5,
      "Platinum": 450.0
    }
  },
  {
    "code": "SH-02",
    "unit": "per ring",
    "typical": {
      "14K": 200.0,
      "18K": 240.0,
      "22K": 310.0,
      "24K": 350.0,
      "Platinum": 600.0
    }
  },
  {
    "code": "SH-03",
    "unit": "per ring",
    "typical": {
      "14K": 300.0,
      "18K": 360.0,
      "22K": 465.0,
      "24K": 525.0,
      "Platinum": 900.0
    }
  },
  {
    "code": "SH-04",
    "unit": "per ring",
    "typical": {
      "14K": 400.0,
      "18K": 480.0,
      "22K": 620.0,
      "24K": 700.0,
      "Platinum": 1200.0
    }
  },
  {
    "code": "SH-05",
    "unit": "per ring",
    "typical": {
      "14K": 250.0,
      "18K": 300.0,
      "22K": 387.5,
      "24K": 437.5,
      "Platinum": 750.0
    }
  },
  {
    "code": "SH-06",
    "unit": "per ring",
    "typical": {
      "14K": 350.0,
      "18K": 420.0,
      "22K": 542.5,
      "24K": 612.5,
      "Platinum": 1050.0
    }
  },
  {
    "code": "SH-07",
    "unit": "per ring",
    "typical": {
      "14K": 60.0,
      "18K": 69.0,
      "22K": 81.0,
      "24K": 90.0,
      "Platinum": 120.0
    }
  },
  {
    "code": "SH-08",
    "unit": "per set",
    "typical": {
      "14K": 85.0,
      "18K": 97.75,
      "22K": 114.75,
      "24K": 127.5,
      "Platinum": 170.0
    }
  },
  {
    "code": "SH-09",
    "unit": "per set",
    "typical": {
      "14K": 120.0,
      "18K": 138.0,
      "22K": 162.0,
      "24K": 180.0,
      "Platinum": 240.0
    }
  },
  {
    "code": "SH-10",
    "unit": "per set",
    "typical": {
      "14K": 100.0,
      "18K": 100.0,
      "22K": 110.0,
      "24K": 115.0,
      "Platinum": 120.0
    }
  },
  {
    "code": "SH-11",
    "unit": "per ring",
    "typical": {
      "14K": 75.0,
      "18K": 75.0,
      "22K": 82.5,
      "24K": 86.25,
      "Platinum": 90.0
    }
  },
  {
    "code": "SH-12",
    "unit": "per ring",
    "typical": {
      "14K": 150.0,
      "18K": 180.0,
      "22K": 232.5,
      "24K": null,
      "Platinum": 450.0
    }
  },
  {
    "code": "PR-01",
    "unit": "per prong",
    "typical": {
      "14K": 50.0,
      "18K": 57.5,
      "22K": 67.5,
      "24K": null,
      "Platinum": 100.0
    }
  },
  {
    "code": "PR-02",
    "unit": "per prong",
    "typical": {
      "14K": 60.0,
      "18K": 69.0,
      "22K": 81.0,
      "24K": null,
      "Platinum": 120.0
    }
  },
  {
    "code": "PR-03",
    "unit": "per head",
    "typical": {
      "14K": 150.0,
      "18K": 172.5,
      "22K": 202.5,
      "24K": null,
      "Platinum": 300.0
    }
  },
  {
    "code": "PR-04",
    "unit": "per prong",
    "typical": {
      "14K": 60.0,
      "18K": 69.0,
      "22K": 81.0,
      "24K": null,
      "Platinum": 120.0
    }
  },
  {
    "code": "PR-05",
    "unit": "per ring",
    "typical": {
      "14K": 50.0,
      "18K": 50.0,
      "22K": 55.0,
      "24K": 57.5,
      "Platinum": 60.0
    }
  },
  {
    "code": "PR-06",
    "unit": "per head",
    "typical": {
      "14K": 110.0,
      "18K": 126.5,
      "22K": 148.5,
      "24K": null,
      "Platinum": 220.0
    }
  },
  {
    "code": "PR-07",
    "unit": "per head",
    "typical": {
      "14K": 150.0,
      "18K": 172.5,
      "22K": 202.5,
      "24K": null,
      "Platinum": 300.0
    }
  },
  {
    "code": "PR-08",
    "unit": "per head",
    "typical": {
      "14K": 190.0,
      "18K": 218.5,
      "22K": 256.5,
      "24K": null,
      "Platinum": 380.0
    }
  },
  {
    "code": "PR-09",
    "unit": "per head",
    "typical": {
      "14K": 230.0,
      "18K": 264.5,
      "22K": 310.5,
      "24K": null,
      "Platinum": 460.0
    }
  },
  {
    "code": "PR-10",
    "unit": "per head",
    "typical": {
      "14K": 50.0,
      "18K": 57.5,
      "22K": 67.5,
      "24K": null,
      "Platinum": 100.0
    }
  },
  {
    "code": "ST-01",
    "unit": "per ring",
    "typical": {
      "14K": 65.0,
      "18K": 65.0,
      "22K": 71.5,
      "24K": 74.75,
      "Platinum": 78.0
    }
  },
  {
    "code": "ST-02",
    "unit": "per stone",
    "typical": {
      "14K": 55.0,
      "18K": 55.0,
      "22K": 60.5,
      "24K": 63.25,
      "Platinum": 66.0
    }
  },
  {
    "code": "ST-03",
    "unit": "per stone",
    "typical": {
      "14K": 55.0,
      "18K": 55.0,
      "22K": 60.5,
      "24K": 63.25,
      "Platinum": 66.0
    }
  },
  {
    "code": "ST-04",
    "unit": "per stone",
    "typical": {
      "14K": 65.0,
      "18K": 65.0,
      "22K": 71.5,
      "24K": 74.75,
      "Platinum": 78.0
    }
  },
  {
    "code": "ST-05",
    "unit": "per stone",
    "typical": {
      "14K": 50.0,
      "18K": 50.0,
      "22K": 55.0,
      "24K": null,
      "Platinum": 60.0
    }
  },
  {
    "code": "ST-06",
    "unit": "per stone",
    "typical": {
      "14K": 58.0,
      "18K": 58.0,
      "22K": 63.8,
      "24K": null,
      "Platinum": 69.6
    }
  },
  {
    "code": "ST-07",
    "unit": "per stone",
    "typical": {
      "14K": 80.0,
      "18K": 80.0,
      "22K": 88.0,
      "24K": null,
      "Platinum": 96.0
    }
  },
  {
    "code": "ST-08",
    "unit": "per stone",
    "typical": {
      "14K": 95.0,
      "18K": 95.0,
      "22K": 104.5,
      "24K": null,
      "Platinum": 114.0
    }
  },
  {
    "code": "ST-09",
    "unit": "per stone",
    "typical": {
      "14K": 180.0,
      "18K": 180.0,
      "22K": 198.0,
      "24K": null,
      "Platinum": 216.0
    }
  },
  {
    "code": "ST-10",
    "unit": "per stone",
    "typical": {
      "14K": 55.0,
      "18K": 55.0,
      "22K": 60.5,
      "24K": 63.25,
      "Platinum": 66.0
    }
  },
  {
    "code": "ST-11",
    "unit": "per mm",
    "typical": {
      "14K": 10.0,
      "18K": 11.5,
      "22K": 13.5,
      "24K": null,
      "Platinum": 20.0
    }
  },
  {
    "code": "ST-12",
    "unit": "per stone",
    "typical": {
      "14K": 15.0,
      "18K": 15.0,
      "22K": 16.5,
      "24K": 17.25,
      "Platinum": 18.0
    }
  },
  {
    "code": "CH-01",
    "unit": "per break",
    "typical": {
      "14K": 25.0,
      "18K": 28.75,
      "22K": 33.75,
      "24K": 37.5,
      "Platinum": 50.0
    }
  },
  {
    "code": "CH-02",
    "unit": "per break",
    "typical": {
      "14K": 40.0,
      "18K": 46.0,
      "22K": 54.0,
      "24K": 60.0,
      "Platinum": 80.0
    }
  },
  {
    "code": "CH-03",
    "unit": "per break",
    "typical": {
      "14K": 100.0,
      "18K": 115.0,
      "22K": 135.0,
      "24K": 150.0,
      "Platinum": 200.0
    }
  },
  {
    "code": "CH-04",
    "unit": "per clasp",
    "typical": {
      "14K": 30.0,
      "18K": 34.5,
      "22K": 40.5,
      "24K": null,
      "Platinum": 60.0
    }
  },
  {
    "code": "CH-05",
    "unit": "per clasp",
    "typical": {
      "14K": 60.0,
      "18K": 69.0,
      "22K": 81.0,
      "24K": null,
      "Platinum": 120.0
    }
  },
  {
    "code": "CH-06",
    "unit": "per clasp",
    "typical": {
      "14K": 80.0,
      "18K": 92.0,
      "22K": 108.0,
      "24K": null,
      "Platinum": 160.0
    }
  },
  {
    "code": "CH-07",
    "unit": "per clasp",
    "typical": {
      "14K": 75.0,
      "18K": 86.25,
      "22K": 101.25,
      "24K": null,
      "Platinum": 150.0
    }
  },
  {
    "code": "CH-08",
    "unit": "per ring",
    "typical": {
      "14K": 22.0,
      "18K": 25.3,
      "22K": 29.7,
      "24K": 33.0,
      "Platinum": 44.0
    }
  },
  {
    "code": "CH-09",
    "unit": "per item",
    "typical": {
      "14K": 80.0,
      "18K": 92.0,
      "22K": 108.0,
      "24K": null,
      "Platinum": 160.0
    }
  },
  {
    "code": "CH-10",
    "unit": "per item",
    "typical": {
      "14K": 45.0,
      "18K": 51.75,
      "22K": 60.75,
      "24K": null,
      "Platinum": 90.0
    }
  },
  {
    "code": "CH-11",
    "unit": "per clasp",
    "typical": {
      "14K": 20.0,
      "18K": 20.0,
      "22K": 22.0,
      "24K": 23.0,
      "Platinum": 24.0
    }
  },
  {
    "code": "CH-12",
    "unit": "per item",
    "typical": {
      "14K": 35.0,
      "18K": 40.25,
      "22K": 47.25,
      "24K": 52.5,
      "Platinum": 70.0
    }
  },
  {
    "code": "CH-13",
    "unit": "per joint",
    "typical": {
      "14K": 40.0,
      "18K": 46.0,
      "22K": 54.0,
      "24K": 60.0,
      "Platinum": 80.0
    }
  },
  {
    "code": "ER-01",
    "unit": "per earring",
    "typical": {
      "14K": 40.0,
      "18K": 46.0,
      "22K": 54.0,
      "24K": null,
      "Platinum": 80.0
    }
  },
  {
    "code": "ER-02",
    "unit": "per earring",
    "typical": {
      "14K": 30.0,
      "18K": 30.0,
      "22K": 33.0,
      "24K": 34.5,
      "Platinum": 36.0
    }
  },
  {
    "code": "ER-03",
    "unit": "per earring",
    "typical": {
      "14K": 45.0,
      "18K": 51.75,
      "22K": 60.75,
      "24K": 67.5,
      "Platinum": 90.0
    }
  },
  {
    "code": "ER-04",
    "unit": "per pair",
    "typical": {
      "14K": 20.0,
      "18K": 23.0,
      "22K": 27.0,
      "24K": null,
      "Platinum": 40.0
    }
  },
  {
    "code": "ER-05",
    "unit": "per pair",
    "typical": {
      "14K": 120.0,
      "18K": 138.0,
      "22K": 162.0,
      "24K": null,
      "Platinum": 240.0
    }
  },
  {
    "code": "ER-06",
    "unit": "per item",
    "typical": {
      "14K": 45.0,
      "18K": 51.75,
      "22K": 60.75,
      "24K": null,
      "Platinum": 90.0
    }
  },
  {
    "code": "RF-01",
    "unit": "per ring",
    "typical": {
      "14K": 40.0,
      "18K": 40.0,
      "22K": 44.0,
      "24K": 46.0,
      "Platinum": 48.0
    }
  },
  {
    "code": "RF-02",
    "unit": "per item",
    "typical": {
      "14K": 50.0,
      "18K": 50.0,
      "22K": 55.0,
      "24K": null,
      "Platinum": 60.0
    }
  },
  {
    "code": "RF-03",
    "unit": "per item",
    "typical": {
      "14K": 40.0,
      "18K": 40.0,
      "22K": 44.0,
      "24K": 46.0,
      "Platinum": 48.0
    }
  },
  {
    "code": "RF-04",
    "unit": "per item",
    "typical": {
      "14K": 60.0,
      "18K": 60.0,
      "22K": 66.0,
      "24K": null,
      "Platinum": 72.0
    }
  },
  {
    "code": "RF-05",
    "unit": "per item",
    "typical": {
      "14K": 25.0,
      "18K": 25.0,
      "22K": 27.5,
      "24K": 28.75,
      "Platinum": 30.0
    }
  },
  {
    "code": "RF-06",
    "unit": "per item",
    "typical": {
      "14K": 60.0,
      "18K": 60.0,
      "22K": 66.0,
      "24K": 69.0,
      "Platinum": 72.0
    }
  },
  {
    "code": "PL-01",
    "unit": "per inch",
    "typical": {
      "14K": 5.0,
      "18K": 5.0,
      "22K": 5.5,
      "24K": 5.75,
      "Platinum": 6.0
    }
  },
  {
    "code": "PL-02",
    "unit": "per inch",
    "typical": {
      "14K": 2.5,
      "18K": 2.5,
      "22K": 2.75,
      "24K": 2.875,
      "Platinum": 3.0
    }
  },
  {
    "code": "PL-03",
    "unit": "per pearl",
    "typical": {
      "14K": 20.0,
      "18K": 20.0,
      "22K": 22.0,
      "24K": 23.0,
      "Platinum": 24.0
    }
  },
  {
    "code": "MS-01",
    "unit": "per item",
    "typical": {
      "14K": 50.0,
      "18K": 50.0,
      "22K": 55.0,
      "24K": 57.5,
      "Platinum": 60.0
    }
  },
  {
    "code": "MS-02",
    "unit": "per item",
    "typical": {
      "14K": 100.0,
      "18K": 100.0,
      "22K": 110.0,
      "24K": 115.0,
      "Platinum": 120.0
    }
  },
  {
    "code": "BG-01",
    "unit": "per bangle",
    "typical": {
      "14K": 110.0,
      "18K": 132.0,
      "22K": 170.5,
      "24K": 192.5,
      "Platinum": 330.0
    }
  },
  {
    "code": "BG-02",
    "unit": "per bangle",
    "typical": {
      "14K": 185.0,
      "18K": 222.0,
      "22K": 286.75,
      "24K": null,
      "Platinum": 555.0
    }
  },
  {
    "code": "BG-03",
    "unit": "per bangle",
    "typical": {
      "14K": 85.0,
      "18K": 85.0,
      "22K": 93.5,
      "24K": 97.75,
      "Platinum": 102.0
    }
  },
  {
    "code": "BG-04",
    "unit": "per joint",
    "typical": {
      "14K": 75.0,
      "18K": 86.25,
      "22K": 101.25,
      "24K": 112.5,
      "Platinum": 150.0
    }
  },
  {
    "code": "BG-05",
    "unit": "per bangle",
    "typical": {
      "14K": 45.0,
      "18K": 45.0,
      "22K": 49.5,
      "24K": 51.75,
      "Platinum": 54.0
    }
  },
  {
    "code": "BG-06",
    "unit": "per bangle",
    "typical": {
      "14K": 90.0,
      "18K": 103.5,
      "22K": 121.5,
      "24K": 135.0,
      "Platinum": 180.0
    }
  },
  {
    "code": "BG-07",
    "unit": "per bangle",
    "typical": {
      "14K": 95.0,
      "18K": 95.0,
      "22K": 104.5,
      "24K": 109.25,
      "Platinum": 114.0
    }
  },
  {
    "code": "BG-08",
    "unit": "per repair",
    "typical": {
      "14K": 125.0,
      "18K": 143.75,
      "22K": 168.75,
      "24K": 187.5,
      "Platinum": 250.0
    }
  },
  {
    "code": "BG-09",
    "unit": "per section",
    "typical": {
      "14K": 150.0,
      "18K": 172.5,
      "22K": 202.5,
      "24K": null,
      "Platinum": 300.0
    }
  },
  {
    "code": "BG-10",
    "unit": "per hinge",
    "typical": {
      "14K": 75.0,
      "18K": 86.25,
      "22K": 101.25,
      "24K": 112.5,
      "Platinum": 150.0
    }
  },
  {
    "code": "BG-11",
    "unit": "per hinge",
    "typical": {
      "14K": 185.0,
      "18K": 212.75,
      "22K": 249.75,
      "24K": null,
      "Platinum": 370.0
    }
  },
  {
    "code": "BG-12",
    "unit": "per clasp",
    "typical": {
      "14K": 85.0,
      "18K": 97.75,
      "22K": 114.75,
      "24K": null,
      "Platinum": 170.0
    }
  },
  {
    "code": "BG-13",
    "unit": "per clasp",
    "typical": {
      "14K": 25.0,
      "18K": 25.0,
      "22K": 27.5,
      "24K": 28.75,
      "Platinum": 30.0
    }
  },
  {
    "code": "BG-14",
    "unit": "per bangle",
    "typical": {
      "14K": 60.0,
      "18K": 69.0,
      "22K": 81.0,
      "24K": null,
      "Platinum": 120.0
    }
  },
  {
    "code": "BG-15",
    "unit": "per bangle",
    "typical": {
      "14K": 80.0,
      "18K": 92.0,
      "22K": 108.0,
      "24K": null,
      "Platinum": 160.0
    }
  },
  {
    "code": "BG-16",
    "unit": "per stone",
    "typical": {
      "14K": 55.0,
      "18K": 55.0,
      "22K": 60.5,
      "24K": 63.25,
      "Platinum": 66.0
    }
  },
  {
    "code": "BG-17",
    "unit": "per stone",
    "typical": {
      "14K": 65.0,
      "18K": 65.0,
      "22K": 71.5,
      "24K": 74.75,
      "Platinum": 78.0
    }
  },
  {
    "code": "BG-18",
    "unit": "per bangle",
    "typical": {
      "14K": 60.0,
      "18K": 60.0,
      "22K": 66.0,
      "24K": 69.0,
      "Platinum": 72.0
    }
  },
  {
    "code": "BG-19",
    "unit": "per closure",
    "typical": {
      "14K": 70.0,
      "18K": 80.5,
      "22K": 94.5,
      "24K": null,
      "Platinum": 140.0
    }
  },
  {
    "code": "BG-20",
    "unit": "per joint",
    "typical": {
      "14K": 95.0,
      "18K": 109.25,
      "22K": 128.25,
      "24K": 142.5,
      "Platinum": 190.0
    }
  },
  {
    "code": "BG-21",
    "unit": "per bangle",
    "typical": {
      "14K": 35.0,
      "18K": 35.0,
      "22K": 38.5,
      "24K": 40.25,
      "Platinum": 42.0
    }
  }
];

export function catalogPrice(serviceCode, metals) {
  const service = PRICES.find(entry => entry.code === serviceCode);
  if (!service) throw new Error('Choose a repair service from the catalog.');
  if (!Array.isArray(metals) || metals.length < 1 || metals.length > 3) throw new Error('Use between 1 and 3 metals.');
  const bases = metals.map(({ metal, purity }) => {
    if (metal === 'Platinum' && ['850 platinum', '900 platinum', '950 platinum', '999 platinum'].includes(purity)) return 'Platinum';
    if (['Yellow gold', 'White gold', 'Rose gold', 'Gold (color unknown)'].includes(metal)) {
      if (purity === '14K / 585') return '14K';
      if (purity === '18K / 750') return '18K';
      if (purity === '22K / 916') return '22K';
      if (purity === '24K / 999') return '24K';
    }
    return null;
  });
  const basis = bases.every(value => value && value === bases[0]) ? bases[0] : null;
  const amount = basis ? service.typical[basis] : null;
  const unknown = metals.some(({metal, purity}) => metal === 'Unknown' || purity === 'Unknown');
  /** @type {'priced'|'not_offered'|'confirm_metal'|'unsupported_metal'} */
  const availability = amount !== null ? 'priced' : basis ? 'not_offered' : unknown ? 'confirm_metal' : 'unsupported_metal';
  return { amount, currency: 'USD', basis, unit: service.unit, availability };
}
