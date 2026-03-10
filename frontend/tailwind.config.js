/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bgMain: '#0f172a',
                bgPanel: '#1e293b',
                primary: '#38bdf8',
                accent: '#6366f1',
                danger: '#ef4444',
            }
        },
    },
    plugins: [],
}
