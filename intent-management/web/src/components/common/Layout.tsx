import { Layout as AntdLayout, Menu, Button, theme } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  SearchOutlined,
  NodeIndexOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const { Header, Content, Sider } = AntdLayout;

interface LayoutProps {
  loading?: boolean;
}

const AppLayout: React.FC<LayoutProps> = ({ loading }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '网络概览',
    },
    {
      key: '/intents',
      icon: <NodeIndexOutlined />,
      label: '意图列表',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleSearch = () => {
    console.log('Search clicked');
  };

  const handleSettings = () => {
    console.log('Settings clicked');
  };

  return (
    <AntdLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={200}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#6366f1',
          }}>
            🎯
          </h2>
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>

      <AntdLayout style={{ marginLeft: collapsed ? 80 : 200 }}>
        <Header
          style={{
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: colorBgContainer,
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Button
            icon={<SearchOutlined />}
            type="text"
            size="large"
            onClick={handleSearch}
          >
            搜索意图
          </Button>
          <Button
            icon={<SettingOutlined />}
            type="text"
            size="large"
            onClick={handleSettings}
          >
            设置
          </Button>
        </Header>

        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 'calc(100vh - 88px)',
            overflow: 'auto',
            background: loading ? '#fafafa' : undefined,
          }}
        >
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '400px',
              flexDirection: 'column',
              gap: '16px',
            }}>
              <div style={{ fontSize: '48px' }}>🔄</div>
              <div style={{ color: '#999', fontSize: '16px' }}>
                正在加载意图网络...
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </Content>
      </AntdLayout>
    </AntdLayout>
  );
};

export default AppLayout;
