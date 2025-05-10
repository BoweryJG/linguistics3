# mUiLinguistics Frontend

## API Backend Connection

This frontend project is connected to the backend at:
- **Backend URL**: `https://osbackend-zl1h.onrender.com`

## Configuration Details

The API connection is configured in `src/api.js` with these key features:
- Connection to `https://osbackend-zl1h.onrender.com` via the VITE_API_URL environment variable
- API requests include proper error handling, timeouts, and CORS proxy fallback
- Authentication header inclusion when available

## Testing the Connection

Two test scripts are provided to verify the backend connection:

1. **Direct Backend Test**:
   ```bash
   # Run this command to test direct connectivity to the backend
   node test-backend-connection.js
   ```

2. **Browser API Test**:
   - Start the application with `npm run dev`
   - Open the browser console (F12)
   - Copy and paste the script from `test-api-connection.js` into the console

Or use the provided test script to run everything:
```bash
# Make executable if needed
chmod +x run-tests.sh

# Run the tests
./run-tests.sh
```

## Repository Setup

This project is hosted on GitHub at: https://github.com/BoweryJG/linguistics3

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `./make-commits.sh` - Utility to create multiple test commits

## Documentation

For detailed information about the changes made to connect to the backend:
- See `change-summary.md` for a comprehensive overview
- Examine `test-backend-connection.js` and `test-api-connection.js` for connection details

## Additional Resources

- Backend API documentation available at: https://osbackend-zl1h.onrender.com/docs
- Contact support at: support@muiapp.com
