import '@testing-library/jest-dom';

// Provide a minimal global localStorage mock for tests
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem(key: string) {
			return store[key] ?? null;
		},
		setItem(key: string, value: string) {
			store[key] = String(value);
		},
		removeItem(key: string) {
			delete store[key];
		},
		clear() {
			store = {};
		},
	};
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });
