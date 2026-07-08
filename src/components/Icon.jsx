const paths = {
  feather: (
    <>
      <path d="M20.5 3.5c-5.8-.2-10.2 1.7-13.2 5.7-2.4 3.2-2.7 6.7-2.7 9.3" />
      <path d="M20.5 3.5c.2 5.8-1.7 10.2-5.7 13.2-3.2 2.4-6.7 2.7-9.3 2.7" />
      <path d="m7.3 16.7 9.4-9.4" />
      <path d="M5 21c2.5-5 5.8-8.8 10-11.5" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  chat: (
    <>
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.5-4.5A8 8 0 1 1 21 12Z" />
    </>
  ),
  library: (
    <>
      <rect x="3" y="4" width="7" height="16" rx="1.5" />
      <rect x="14" y="4" width="7" height="16" rx="1.5" />
      <path d="M10 7h4" />
      <path d="M10 17h4" />
    </>
  ),
  bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
  template: (
    <>
      <path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </>
  ),
  voice: (
    <>
      <path d="M4 12v2" />
      <path d="M8 8v8" />
      <path d="M12 4v16" />
      <path d="M16 7v10" />
      <path d="M20 10v4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1L3.7 17l.1-.1A1.7 1.7 0 0 0 4.1 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.3V9.6h.1A1.7 1.7 0 0 0 4.1 8.5a1.7 1.7 0 0 0-.3-1.9l-.1-.1L6.5 3.7l.1.1A1.7 1.7 0 0 0 8.5 4.1a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2.3h4.1v.1A1.7 1.7 0 0 0 15 4.1a1.7 1.7 0 0 0 1.9-.3l.1-.1 2.8 2.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1v4.1h-.1A1.7 1.7 0 0 0 19.4 15Z" />
    </>
  ),
  story: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M8 4v16" />
      <path d="M8 9h13" />
      <path d="M8 15h13" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v18H7.5A3.5 3.5 0 0 0 4 23V5.5Z" />
      <path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v18h3.5A3.5 3.5 0 0 1 20 23V5.5Z" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.3 2.3 0 1 1 3.4 2c-.8.4-1.2 1-1.2 2" />
      <path d="M12 17h.01" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.42 1.42" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.42" />
    </>
  ),
  moon: <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />,
  sparkles: (
    <>
      <path d="m12 3 1.1 3.2L16 7.5l-2.9 1.3L12 12l-1.1-3.2L8 7.5l2.9-1.3L12 3Z" />
      <path d="m18.5 13 .7 2 1.8.8-1.8.8-.7 2-.7-2-1.8-.8 1.8-.8.7-2Z" />
      <path d="m5.5 14 .8 2.2 2 .8-2 .8L5.5 20l-.8-2.2-2-.8 2-.8.8-2.2Z" />
    </>
  ),
  crown: (
    <>
      <path d="m3 7 4 4 5-7 5 7 4-4-2 12H5L3 7Z" />
      <path d="M5 19h14" />
    </>
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  bulb: (
    <>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M8.5 14.5A6 6 0 1 1 15.5 14.5c-.9.7-1.5 1.6-1.5 2.5h-4c0-.9-.6-1.8-1.5-2.5Z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 22a8 8 0 0 1 16 0" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  pen: (
    <>
      <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
      <path d="m13.5 8 3 3" />
    </>
  ),
  translate: (
    <>
      <path d="M4 5h10" />
      <path d="M9 3v2" />
      <path d="M6 9c1.5 3 4 5 7 6" />
      <path d="M12 5c-.7 3.5-3 6.4-6 8" />
      <path d="m14 21 4-10 4 10" />
      <path d="M15.5 17h5" />
    </>
  ),
  document: (
    <>
      <path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8" />
      <path d="M8 17h8" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4 6v5c0 5.2 3.4 8.4 8 10 4.6-1.6 8-4.8 8-10V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  paperclip: <path d="m20.5 11.5-8.3 8.3a5 5 0 0 1-7.1-7.1l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-2.8-2.8l8.3-8.3" />,
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
      <path d="M22 2 11 13" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  )
};

function Icon({ name, size = 20, className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {paths[name] || paths.sparkles}
    </svg>
  );
}

export default Icon;
