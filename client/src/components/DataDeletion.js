import React, { useContext, useState } from 'react'
const DataDeletion = () => {
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (event) => {
        event.preventDefault();
        // You would typically handle the submission by sending the data to your backend here.
        console.log('Data Deletion Request Submitted:', { email, userId });
        setSubmitted(true);
    };

    return (
        <div className="data-deletion-request">
            <h1>Data Deletion Request</h1>
            <p>If you wish to delete your data associated with our application, you can either:</p>
            
            <h2>Email Us</h2>
            <p>Please send an email to <a href="mailto:delete-my-data@myapp.com">delete-my-data@myapp.com</a> with your account details (such as email address or user ID).</p>
            
            <h2>Submit Your Request Directly</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="email">Your Email:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <label htmlFor="userId">Your User ID (optional):</label>
                <input
                    type="text"
                    id="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                />
                <button type="submit">Submit Request</button>
            </form>
            {submitted && <p>Thank you! Your request has been received and will be processed shortly.</p>}
        </div>
    );

}


export default DataDeletion