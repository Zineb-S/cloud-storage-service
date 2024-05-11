import React from 'react';
import NavBar from './NavBar';
import { Card, Button, Row, Col, Container } from 'react-bootstrap';

const HomePage = () => {
    return (
        <>
            <NavBar />
            <Container className="mt-5">
                <Row className="align-items-center">
                    <Col md={6}>
                        <h1>Welcome to BexCloud</h1>
                        <p>Your secure cloud storage solution. Easily store, manage, and access your files from anywhere.</p>
                        <Button variant="primary">Learn More</Button>
                    </Col>
                    <Col md={6}>
                        <img src="https://via.placeholder.com/500x300" alt="Cloud Storage" className="img-fluid" />
                    </Col>
                </Row>
                <Row className="mt-5">
                    <h2>Pricing Plans</h2>
                    <Col md={4}>
                        <Card>
                            <Card.Header>Basic</Card.Header>
                            <Card.Body>
                                <Card.Title>Free</Card.Title>
                                <Card.Text>
                                    5 GB of storage<br />
                                    Basic support<br />
                                    Single user
                                </Card.Text>
                                <Button variant="secondary">Sign Up</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card>
                            <Card.Header>Pro</Card.Header>
                            <Card.Body>
                                <Card.Title>$9.99/month</Card.Title>
                                <Card.Text>
                                    50 GB of storage<br />
                                    Priority support<br />
                                    Multi-user access
                                </Card.Text>
                                <Button variant="success">Get Pro</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card>
                            <Card.Header>Enterprise</Card.Header>
                            <Card.Body>
                                <Card.Title>Contact Us</Card.Title>
                                <Card.Text>
                                    Unlimited storage<br />
                                    Dedicated support<br />
                                    Custom solutions
                                </Card.Text>
                                <Button variant="primary">Contact Sales</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
}

export default HomePage;
