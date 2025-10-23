// Mock data for development 
export const boardingHouses = [
  {
    id: '1',
    name: 'Sunrise Boarding House',
    price: 3500,
    location: 'Divisoria, Cagayan de Oro',
    rating: 4.5,
    reviews: 128,
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400',
    type: 'Single Room',
    amenities: ['WiFi', 'Laundry', 'Kitchen', 'CR'],
    distance: '0.8 km',
    description: 'Cozy single rooms with basic amenities. Perfect for students and working professionals.',
    landlord: {
      name: 'Maria Santos',
      phone: '09123456789',
      verified: true
    }
  },
  {
    id: '2',
    name: 'CDO Student Dorm',
    price: 2800,
    location: 'Nazareth, Cagayan de Oro',
    rating: 4.2,
    reviews: 95,
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
    type: 'Shared Room',
    amenities: ['WiFi', 'Study Area', 'CR', '24/7 Security'],
    distance: '1.2 km',
    description: 'Affordable shared accommodation for students near universities.',
    landlord: {
      name: 'John Lim',
      phone: '09198765432',
      verified: true
    }
  },
  {
    id: '3',
    name: 'Green Valley Apartelle',
    price: 4500,
    location: 'Carmen, Cagayan de Oro',
    rating: 4.8,
    reviews: 203,
    image: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=400',
    type: 'Studio Unit',
    amenities: ['WiFi', 'Aircon', 'Kitchen', 'CR', 'Parking'],
    distance: '2.1 km',
    description: 'Modern studio units with complete amenities for comfortable living.',
    landlord: {
      name: 'Robert Tan',
      phone: '09151234567',
      verified: true
    }
  },
  {
    id: '4',
    name: 'XU Area Boarding',
    price: 3200,
    location: 'Corrales Ext, Cagayan de Oro',
    rating: 4.3,
    reviews: 87,
    image: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=400',
    type: 'Single Room',
    amenities: ['WiFi', 'CR', 'Study Area'],
    distance: '0.5 km',
    description: 'Walking distance to Xavier University. Ideal for students.',
    landlord: {
      name: 'Susan Chen',
      phone: '09159876543',
      verified: false
    }
  },
  {
    id: '5',
    name: 'Downtown Comfort',
    price: 5200,
    location: 'Lapasan, Cagayan de Oro',
    rating: 4.6,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400',
    type: 'Studio Unit',
    amenities: ['WiFi', 'Aircon', 'Kitchen', 'CR', 'Parking', 'Laundry'],
    distance: '1.8 km',
    description: 'Premium studio units with complete facilities and security.',
    landlord: {
      name: 'Michael Ong',
      phone: '09157778899',
      verified: true
    }
  }
];

export const notifications = [
  {
    id: '1',
    title: 'New Boarding House Available',
    message: 'Sunrise Boarding House has new rooms available near Xavier University.',
    time: '2 hours ago',
    type: 'new_listing',
    read: false,
    actionable: true,
  },
  {
    id: '2',
    title: 'Booking Confirmed',
    message: 'Your booking at CDO Student Dorm has been confirmed for March 2024.',
    time: '1 day ago',
    type: 'booking',
    read: true,
    actionable: true,
  },
  {
    id: '3',
    title: 'Payment Due Soon',
    message: 'Your monthly payment of ₱3,500 is due in 3 days for Sunrise Boarding.',
    time: '2 days ago',
    type: 'payment',
    read: true,
    actionable: true,
  }
];

export const messages = [
  {
    id: '1',
    landlord: {
      name: 'Maria Santos',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
    },
    lastMessage: 'Hi! Are you still interested in the room?',
    time: '10:30 AM',
    unread: true
  },
  {
    id: '2',
    landlord: {
      name: 'John Lim',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    },
    lastMessage: 'The room is available for viewing tomorrow.',
    time: 'Yesterday',
    unread: false
  }
];