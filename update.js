const fs = require('fs');

try {
    let dc = fs.readFileSync('services/doctor-service/src/controllers/doctorController.js', 'utf8');
    dc = dc.replace(
        /if \(doctorProfile\.verificationStatus !== 'pending'\) {[\s\S]*?return res\.status\(403\).*?;[\s\S]*?}/,
        `// Allow updates for pending and approved applications
        if (doctorProfile.verificationStatus === 'rejected') {
            return res.status(403).json({ success: false, message: 'Rejected doctor applications cannot be updated' });
        }`
    );
    fs.writeFileSync('services/doctor-service/src/controllers/doctorController.js', dc, 'utf8');
    console.log('doctorController.js updated');

    let ba = fs.readFileSync('frontend/src/pages/BookAppointment.js', 'utf8');
    ba = ba.replace(
        `import { fetchAllDoctors } from '../services/api';`,
        `import { fetchAllDoctors, createAppointment } from '../services/api';`
    );
    ba = ba.replace(
        `<button onClick={() => setCurrentStep(4)} className="btn btn-primary">Complete Payment <ArrowRightIcon style={{ width: 16, height: 16 }} /></button>`,
        `<button onClick={async () => {
          try {
            await createAppointment({
              doctorId: selectedDoctor.userId?._id || selectedDoctor.userId || selectedDoctor._id,
              appointmentDate: selectedDate,
              timeSlot: selectedTime,
              reason: 'Consultation'
            });
            setCurrentStep(4);
          } catch (e) {
            alert('Failed to book appointment: ' + e.message);
          }
        }} className="btn btn-primary">Complete Payment <ArrowRightIcon style={{ width: 16, height: 16 }} /></button>`
    );
    fs.writeFileSync('frontend/src/pages/BookAppointment.js', ba, 'utf8');
    console.log('BookAppointment.js updated');

    let api = fs.readFileSync('frontend/src/services/api.js', 'utf8');
    api = api.replace(
        `const buildHeaders = (extraHeaders = {}) => {`,
        `const _originalFetch = window.fetch;
window.fetch = async (url, options) => {
  if (typeof url === 'string' && !url.includes('localhost:500')) return _originalFetch(url, options);
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await _originalFetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      const overrideUrl = typeof url === 'string' ? url : 'unknown API';
      throw new Error(\`API Connection Timeout: The backend service at \${overrideUrl} is not responding. Please verify your backend server and Database connection.\`);
    }
    throw error;
  }
};

const buildHeaders = (extraHeaders = {}) => {`
    );
    fs.writeFileSync('frontend/src/services/api.js', api, 'utf8');
    console.log('api.js updated');

} catch(e) {
    console.error(e);
}
