import React from 'react';

export default ({
  width = 35,
  height = 35,
  className,
}: {
  width: number,
  height: number,
  className: ?string,
}) => (
  <svg
    className={className}
    width={width}
    height={height}
    version="1.1"
    >
      <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
          <g id="Ember-Logos" transform="translate(-220.000000, -365.000000)" fill="#E04E39">
              <g id="Ember-Logo" transform="translate(220.041404, 365.000000)">
                  <path d="M253.776,68.6144704 C253.776,68.6144704 247.496,73.4864704 241.968,72.9424704 C236.44,72.3984704 238.176,60.0464704 238.176,60.0464704 C238.176,60.0464704 239.368,48.7184704 236.112,47.7664704 C232.864,46.8224704 228.856,50.7184704 228.856,50.7184704 C228.856,50.7184704 223.872,56.2464704 221.488,63.2944704 L220.832,63.5104704 C220.832,63.5104704 221.592,51.1504704 220.728,48.3344704 C220.08,46.9264704 214.12,47.0384704 213.144,49.5264704 C212.168,52.0224704 207.4,69.3584704 207.072,76.6224704 C207.072,76.6224704 197.752,84.5344704 189.632,85.8304704 C181.504,87.1344704 179.552,82.0384704 179.552,82.0384704 C179.552,82.0384704 201.656,75.8624704 200.896,58.1984704 C200.144,40.5344704 183.072,47.0704704 181.144,48.5184704 C179.272,49.9264704 169.296,55.9424704 166.384,72.6064704 C166.288,73.1664704 166.112,75.6464704 166.112,75.6464704 C166.112,75.6464704 157.552,81.3824704 152.784,82.9024704 C152.784,82.9024704 166.112,60.4704704 149.864,50.2864704 C145.294247,47.5356968 141.310992,50.0664828 138.941541,52.3903567 C137.486481,53.8174277 158.64,30.6784704 153.76,9.97447041 C151.44,0.118470412 146.512,-0.937529588 141.992,0.662470412 C135.128,3.36647041 132.528,7.37447041 132.528,7.37447041 C132.528,7.37447041 123.64,20.2704704 121.576,39.4544704 C119.52,58.6304704 116.488,81.8224704 116.488,81.8224704 C116.488,81.8224704 112.256,85.9424704 108.36,86.1584704 C104.456,86.3664704 106.192,74.5584704 106.192,74.5584704 C106.192,74.5584704 109.224,56.5744704 109.016,53.5344704 C108.792,50.5024704 108.576,48.8784704 105,47.7984704 C101.424,46.7104704 97.5200005,51.2624704 97.5200005,51.2624704 C97.5200005,51.2624704 87.2320005,66.8624704 86.3680005,69.2464704 L85.8160005,70.2304704 L85.2800005,69.5744704 C85.2800005,69.5744704 92.5360005,48.3344704 85.6080005,48.0144704 C78.6720005,47.6864704 74.1200005,55.5984704 74.1200005,55.5984704 C74.1200005,55.5984704 66.2080005,68.8224704 65.8800005,70.3344704 L65.3440005,69.6864704 C65.3440005,69.6864704 68.5920005,54.3024704 67.9440005,50.5024704 C67.2880005,46.7104704 63.7200005,47.4704704 63.7200005,47.4704704 C63.7200005,47.4704704 59.1680005,46.9264704 57.9760005,49.8544704 C56.7840005,52.7824704 52.4480005,72.1744704 51.9040005,78.3504704 C51.9040005,78.3504704 40.5280005,86.4784704 33.0480005,86.5824704 C25.5760005,86.6944704 26.3360005,81.8464704 26.3360005,81.8464704 C26.3360005,81.8464704 53.7520005,72.4624704 46.2720005,53.9344704 C42.9120005,49.1664704 39.0160005,47.6704704 33.4880005,47.7744704 C27.9600005,47.8864704 21.1040005,51.2544704 16.6640005,61.2224704 C14.5360005,65.9744704 13.7680005,70.4944704 13.3280005,73.9024704 C13.3280005,73.9024704 8.53600048,74.8864704 5.93600048,72.7184704 C3.32800048,70.5504704 1.99200048,72.7184704 1.99200048,72.7184704 C1.99200048,72.7184704 -2.47199952,78.4144704 1.96800048,80.1424704 C6.41600048,81.8784704 13.3440005,82.6864704 13.3440005,82.6864704 C13.9840005,85.7184704 15.8320005,90.8784704 21.2480005,94.9824704 C29.3760005,101.15847 44.9680005,94.4144704 44.9680005,94.4144704 L51.3600005,90.8304704 C51.3600005,90.8304704 51.5760005,96.6944704 56.2400005,97.5504704 C60.8960005,98.4064704 62.8480005,97.5344704 70.9760005,77.8144704 C75.7440005,67.7344704 76.0720005,68.2784704 76.0720005,68.2784704 C76.6080005,68.1664704 72.9280005,87.4544704 74.3360005,92.6544704 C75.7440005,97.8624704 81.9200005,97.3184704 81.9200005,97.3184704 C81.9200005,97.3184704 85.2800005,97.9664704 87.9920005,88.4304704 C90.6960005,78.8944704 95.9040005,68.3824704 95.9040005,68.3824704 C96.5440005,68.3824704 94.2720005,88.1024704 97.7360005,94.3904704 C101.208,100.67847 110.2,96.5024704 110.2,96.5024704 C110.2,96.5024704 116.488,93.3344704 117.464,92.3584704 C117.464,92.3584704 124.92,98.7104704 135.44,97.5584704 C158.96,92.9264704 167.328,86.6704704 167.328,86.6704704 C167.328,86.6704704 171.368,96.9104704 183.888,97.8624704 C198.184,98.9424704 205.992,89.9504704 205.992,89.9504704 C205.992,89.9504704 205.88,95.7984704 210.864,97.8624704 C215.856,99.9184704 219.208,88.3424704 219.208,88.3424704 L227.552,65.3504704 C228.312,65.3504704 228.744,80.3024704 236.984,82.6864704 C245.216,85.0704704 255.944,77.1024704 255.944,77.1024704 C255.944,77.1024704 258.544,75.6704704 258.112,71.3344704 C257.672,66.9984704 253.776,68.6144704 253.776,68.6144704 Z M36.7360005,57.7664704 C39.6560005,60.5824704 38.5760005,66.6464704 33.0480005,70.4384704 C27.5280005,74.2384704 25.0320005,73.4784704 25.0320005,73.4784704 C25.3600005,60.5824704 33.8160005,54.9424704 36.7360005,57.7664704 Z M144.552,13.2304704 C146.392,22.9824704 128.408,52.0224704 128.408,52.0224704 C128.624,45.5184704 135.016,23.5264704 135.016,23.5264704 C135.016,23.5264704 142.704,3.47847041 144.552,13.2304704 Z M126.776,87.2384704 C126.776,87.2384704 125.368,82.4704704 129.376,69.1424704 C133.392,55.8144704 142.816,61.0144704 142.816,61.0144704 C142.816,61.0144704 149.32,65.9984704 144.224,79.3264704 C139.136,92.6544704 126.776,87.2384704 126.776,87.2384704 Z M181.608,61.1264704 C186.048,52.9984704 189.52,57.4384704 189.52,57.4384704 C189.52,57.4384704 193.312,61.5584704 188.976,67.7344704 C184.64,73.9104704 178.36,73.4784704 178.36,73.4784704 C178.36,73.4784704 177.168,69.2464704 181.608,61.1264704 Z" />
                  <path d="M225.958879,94.0133376 L225.958879,92.4572757 L226.945826,92.4572757 C227.082702,92.4572757 227.219578,92.4716836 227.363657,92.4860916 C227.507737,92.5077036 227.644613,92.5437235 227.759877,92.5941515 C227.882345,92.6445794 227.975997,92.7166193 228.048036,92.8102712 C228.12728,92.9039231 228.1633,93.0335949 228.1633,93.1920827 C228.1633,93.5522822 228.05524,93.7828099 227.839121,93.8764618 C227.623001,93.9701137 227.342045,94.0133376 227.003458,94.0133376 L225.958879,94.0133376 Z M224.784629,91.5423689 L224.784629,97.4640491 L225.958879,97.4640491 L225.958879,94.9354484 L226.693686,94.9354484 L228.134484,97.4640491 L229.366367,97.4640491 L227.781489,94.8778165 C227.997609,94.8562045 228.19932,94.8129806 228.393828,94.7481446 C228.581132,94.6833087 228.746824,94.5896569 228.883699,94.467189 C229.027779,94.3447212 229.135839,94.1862334 229.215083,93.9917256 C229.301531,93.7972179 229.337551,93.5666902 229.337551,93.2929386 C229.337551,92.6517834 229.135839,92.197932 228.73962,91.9385883 C228.336196,91.6720407 227.759877,91.5423689 227.017866,91.5423689 L224.784629,91.5423689 Z M222.904387,94.510413 C222.904387,93.9052778 223.005243,93.3505705 223.214159,92.8462911 C223.423075,92.3420118 223.70403,91.9097724 224.06423,91.5423689 C224.417225,91.1749653 224.842261,90.8868057 225.324928,90.67789 C225.814799,90.4689743 226.333487,90.3681184 226.888194,90.3681184 C227.435697,90.3681184 227.954385,90.4689743 228.437052,90.67789 C228.926923,90.8868057 229.344755,91.1749653 229.704954,91.5423689 C230.065154,91.9097724 230.346109,92.3420118 230.562229,92.8462911 C230.771145,93.3505705 230.879205,93.9052778 230.879205,94.510413 C230.879205,95.1155482 230.771145,95.6702554 230.562229,96.1817388 C230.346109,96.6860181 230.065154,97.1326655 229.704954,97.500069 C229.344755,97.8746765 228.926923,98.1628362 228.437052,98.3717519 C227.954385,98.5806676 227.435697,98.6815235 226.888194,98.6815235 C226.333487,98.6815235 225.814799,98.5806676 225.324928,98.3717519 C224.842261,98.1628362 224.417225,97.8746765 224.06423,97.500069 C223.70403,97.1326655 223.423075,96.6860181 223.214159,96.1817388 C223.005243,95.6702554 222.904387,95.1155482 222.904387,94.510413 Z M221.456385,94.510413 C221.456385,95.3244639 221.607669,96.0520669 221.903033,96.7004261 C222.2056,97.3559892 222.60182,97.9106965 223.098895,98.3717519 C223.603174,98.8328073 224.179494,99.1858028 224.835057,99.4307385 C225.49062,99.6756742 226.174999,99.798142 226.888194,99.798142 C227.608593,99.798142 228.292972,99.6756742 228.948535,99.4307385 C229.604098,99.1858028 230.180418,98.8328073 230.684697,98.3717519 C231.181772,97.9106965 231.577992,97.3559892 231.880559,96.7004261 C232.175923,96.0520669 232.320003,95.3244639 232.320003,94.510413 C232.320003,93.71077 232.175923,92.983167 231.880559,92.3348078 C231.577992,91.6792447 231.181772,91.1245374 230.684697,90.670686 C230.180418,90.2096306 229.604098,89.8566351 228.948535,89.6116994 C228.292972,89.3595597 227.608593,89.2370919 226.888194,89.2370919 C226.174999,89.2370919 225.49062,89.3595597 224.835057,89.6116994 C224.179494,89.8566351 223.603174,90.2096306 223.098895,90.670686 C222.60182,91.1245374 222.2056,91.6792447 221.903033,92.3348078 C221.607669,92.983167 221.456385,93.71077 221.456385,94.510413 Z" />
              </g>
          </g>
      </g>
  </svg>
)

