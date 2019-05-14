import * as React from 'react';

export default ({
  width = 32,
  height = 32,
  className,
}: {
  width?: number;
  height?: number;
  className?: string;
}) => (
  <svg
    className={className}
    width={`${width}px`}
    height={`${height}px`}
    viewBox="0 0 32 32"
  >
    <path
      d="M27.9264 4.23542C24.9531 -0.0244216 19.0922 -1.28236 14.8324 1.43364L7.39912 6.1795C5.36926 7.46603 3.96838 9.52448 3.53954 11.8974C3.19646 13.8701 3.48236 15.8999 4.42581 17.6725C3.79684 18.6445 3.33941 19.7309 3.13928 20.8745C2.71044 23.276 3.28223 25.7633 4.71171 27.7646C7.68501 32.0244 13.5459 33.2824 17.8057 30.5664L25.2676 25.8205C27.2974 24.534 28.6983 22.4755 29.1271 20.1026C29.4702 18.1299 29.1557 16.1001 28.2409 14.3275C28.8698 13.3555 29.3273 12.2691 29.5274 11.1255C29.9277 8.72397 29.3559 6.26527 27.9264 4.23542Z"
      fill="#159497"
    />
    <path
      d="M14.1177 28.1934C11.7161 28.8224 9.17167 27.8789 7.77078 25.8491C6.9131 24.6483 6.57002 23.1617 6.82733 21.7036C6.85592 21.4749 6.94169 21.2462 6.99887 21.0175L7.14181 20.5886L7.51348 20.8745C8.39975 21.5035 9.37179 22.0181 10.4296 22.3326L10.7155 22.4183L10.6869 22.7042C10.6583 23.1045 10.7727 23.4762 11.0014 23.7906C11.4302 24.391 12.2022 24.6769 12.9169 24.5054C13.0884 24.4482 13.2314 24.391 13.3743 24.3053L20.8076 19.5594C21.1793 19.3307 21.4366 18.959 21.4937 18.5302C21.5795 18.1013 21.4652 17.6439 21.2079 17.2722C20.779 16.6719 20.0071 16.386 19.2924 16.5575C19.1208 16.6147 18.9779 16.6719 18.8349 16.7576L15.976 18.5588C15.5185 18.8447 15.0039 19.0734 14.4607 19.2163C12.0592 19.8453 9.51474 18.9018 8.11386 16.872C7.25617 15.6712 6.9131 14.1846 7.19899 12.7265C7.4563 11.297 8.28539 10.0391 9.51474 9.26717L17.0052 4.49272C17.4626 4.20683 17.9772 3.97811 18.5204 3.83516C20.922 3.20619 23.4664 4.14965 24.8673 6.1795C25.725 7.38026 26.0681 8.86692 25.8108 10.325C25.7536 10.5537 25.6964 10.7824 25.6392 11.0111L25.4963 11.44L25.1246 11.1541C24.2383 10.4965 23.2663 10.0105 22.2085 9.69601L21.9226 9.61024L21.9512 9.32435C21.9798 8.9241 21.8654 8.52384 21.6367 8.20936C21.2079 7.60898 20.4359 7.32308 19.7212 7.52321C19.5497 7.58039 19.4067 7.63757 19.2638 7.72334L11.8019 12.4978C11.4302 12.7265 11.1729 13.0982 11.0872 13.527C11.0014 13.9559 11.1158 14.4133 11.3731 14.7849C11.8019 15.3853 12.5452 15.6712 13.2886 15.4997C13.4601 15.4425 13.603 15.3853 13.746 15.2996L16.6049 13.4984C17.0624 13.2125 17.577 12.9838 18.1202 12.8409C20.5217 12.2119 23.0662 13.1553 24.4671 15.1852C25.3247 16.386 25.6678 17.8726 25.4105 19.3307C25.1532 20.7602 24.3241 22.0181 23.0948 22.79L15.6329 27.5359C15.1755 27.8218 14.6609 28.0505 14.1177 28.1934Z"
      fill="white"
    />
  </svg>
);
