import React from 'react';

export const FileIcon = props => (
  <svg width={16} height={16} fill="none" viewBox="0 0 16 16" {...props}>
    <rect width={12} height={12} x={2} y={2} fill="#fff" rx={1} />
    <path fill="#757575" d="M3 5H13V6H3z" />
    <path fill="#0971F1" d="M3 7H13V8H3z" />
    <path fill="#757575" d="M3 9H13V10H3z" />
  </svg>
);

export const CaseSensitiveIcon = props => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      className="frame"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 0H2C0.895431 0 0 0.89543 0 2V12C0 13.1046 0.89543 14 2 14H12C13.1046 14 14 13.1046 14 12V2C14 0.895431 13.1046 0 12 0ZM1 2C1 1.44772 1.44772 1 2 1H12C12.5523 1 13 1.44772 13 2V12C13 12.5523 12.5523 13 12 13H2C1.44772 13 1 12.5523 1 12V2Z"
      fill="currentColor"
    />
    <path
      className="overlay"
      fillOpacity={0.4}
      d="M12 0H2C0.895431 0 0 0.89543 0 2V12C0 13.1046 0.89543 14 2 14H12C13.1046 14 14 13.1046 14 12V2C14 0.895431 13.1046 0 12 0Z"
      fill="currentColor"
    />
    <path
      className="inner"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.89149 8.35228L3.30626 10H2.56763L4.70399 4.18182H5.43126L7.56763 10H6.82899L6.24376 8.35228H3.89149ZM5.0449 5.10228L4.11308 7.72728H6.02217L5.09035 5.10228H5.0449ZM10.3225 9.4091C10.1861 9.69319 9.78842 10.1023 9.02706 10.1023C8.19751 10.1023 7.53842 9.61364 7.53842 8.76137C7.53842 7.76137 8.42195 7.58239 9.2316 7.47728C9.36504 7.46012 9.48537 7.44664 9.59323 7.43456L9.59335 7.43455L9.5934 7.43454C10.1284 7.37462 10.3566 7.34906 10.3566 7.07955V7.05682C10.3566 6.49716 10.0526 6.17046 9.43615 6.17046C8.79695 6.17046 8.44751 6.51137 8.29979 6.82955L7.66342 6.60228C8.00433 5.80682 8.75433 5.57955 9.41342 5.57955C9.97024 5.57955 11.0271 5.73864 11.0271 7.12501V10H10.3566V9.4091H10.3225ZM8.20888 8.79546C8.20888 9.26137 8.59524 9.50001 9.12933 9.50001C9.92479 9.50001 10.3566 8.96591 10.3566 8.42046V7.80682C10.2513 7.93317 9.58994 8.01074 9.26738 8.04857L9.26736 8.04858L9.19751 8.05682C8.67479 8.12501 8.20888 8.2841 8.20888 8.79546Z"
      fill="currentColor"
    />
  </svg>
);

export const RegexIcon = props => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      className="overlay"
      fillOpacity={0.4}
      d="M12 0H2C0.895431 0 0 0.89543 0 2V12C0 13.1046 0.89543 14 2 14H12C13.1046 14 14 13.1046 14 12V2C14 0.895431 13.1046 0 12 0Z"
      fill="currentColor"
    />
    <path
      className="frame"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2 0H12C13.1046 0 14 0.895431 14 2V12C14 13.1046 13.1046 14 12 14H2C0.89543 14 0 13.1046 0 12V2C0 0.89543 0.895431 0 2 0ZM2 1C1.44772 1 1 1.44772 1 2V12C1 12.5523 1.44772 13 2 13H12C12.5523 13 13 12.5523 13 12V2C13 1.44772 12.5523 1 12 1H2Z"
      fill="currentColor"
    />
    <path
      className="inner"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2 8H5V11H2V8ZM9.52555 8H8.47445L8.56204 5.70833L6.52555 6.9375L6 6.0625L8.14599 5L6 3.9375L6.52555 3.0625L8.56204 4.29167L8.47445 2H9.52555L9.43796 4.29167L11.4745 3.0625L12 3.9375L9.85401 5L12 6.0625L11.4745 6.9375L9.43796 5.70833L9.52555 8Z"
      fill="currentColor"
    />
  </svg>
);

export const MoreIcon = () => (
  <svg
    width="12"
    height="3"
    viewBox="0 0 12 3"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.6667 2.66667C9.93029 2.66667 9.33333 2.06971 9.33333 1.33333C9.33333 0.596954 9.93029 -9.047e-08 10.6667 -5.82818e-08C11.403 -2.60936e-08 12 0.596954 12 1.33333C12 2.06971 11.403 2.66667 10.6667 2.66667ZM6 2.66667C5.26362 2.66667 4.66667 2.06971 4.66667 1.33333C4.66667 0.596954 5.26362 -2.94456e-07 6 -2.62268e-07C6.73638 -2.3008e-07 7.33333 0.596954 7.33333 1.33333C7.33333 2.06971 6.73638 2.66667 6 2.66667ZM-5.44177e-05 1.33333C-5.44499e-05 2.06971 0.5969 2.66667 1.33328 2.66667C2.06966 2.66667 2.66661 2.06971 2.66661 1.33333C2.66661 0.596954 2.06966 -4.34069e-07 1.33328 -4.66257e-07C0.5969 -4.98445e-07 -5.43855e-05 0.596954 -5.44177e-05 1.33333Z"
      fill="currentColor"
    />
  </svg>
);
