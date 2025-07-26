import { Drawer } from 'expo-router/drawer';
import CustomDrawerContent from '../../components/CustomDrawerContent';
import { SettingsProvider } from '../../contexts/SettingsContext';

export default function DrawerLayout() {
  return (
    <SettingsProvider>
      <Drawer
        drawerContent={props => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: { backgroundColor: '#fff', width: 250 },
        }}
      >
        <Drawer.Screen 
          name="(tabs)" 
          options={{ 
            title: 'Home',
            drawerItemStyle: { display: 'none' }
          }} 
        />
        <Drawer.Screen 
          name="index" 
          options={{ 
            title: 'Sign Up',
            drawerItemStyle: { display: 'none' }
          }} 
        />
        <Drawer.Screen 
          name="Profile" 
          options={{ 
            title: 'My Profile',
            drawerItemStyle: { display: 'flex' }
          }} 
        />
        <Drawer.Screen 
          name="YourStories" 
          options={{ 
            title: 'Your Stories',
            drawerItemStyle: { display: 'none' }
          }} 
        />
        <Drawer.Screen 
          name="CanvaDesignPage" 
          options={{ 
            title: 'Canva Design',
            drawerItemStyle: { display: 'none' }
          }} 
        />
        <Drawer.Screen 
          name="TemplateEditScreen" 
          options={{ 
            title: 'Template Editor',
            drawerItemStyle: { display: 'none' }
          }} 
        />
        <Drawer.Screen 
          name="AIDesignScreen" 
          options={{ 
            title: 'AI Design Assistant',
            drawerItemStyle: { display: 'flex' }
          }} 
        />
        {/* Settings-related screens */}
        <Drawer.Screen 
          name="NotificationsScreen" 
          options={{ 
            title: 'Notifications',
            drawerItemStyle: { display: 'none' }
          }} 
        />
        <Drawer.Screen 
          name="ExportQualityScreen" 
          options={{ 
            title: 'Export Quality',
            drawerItemStyle: { display: 'none' }
          }} 
        />
        <Drawer.Screen 
          name="HelpSupportScreen" 
          options={{ 
            title: 'Help & Support',
            drawerItemStyle: { display: 'none' }
          }} 
        />
        <Drawer.Screen 
          name="FeedbackScreen" 
          options={{ 
            title: 'Send Feedback',
            drawerItemStyle: { display: 'none' }
          }} 
        />
        <Drawer.Screen 
          name="AboutScreen" 
          options={{ 
            title: 'About Craftiv',
            drawerItemStyle: { display: 'none' }
          }} 
        />
      </Drawer>
    </SettingsProvider>
  );
} 