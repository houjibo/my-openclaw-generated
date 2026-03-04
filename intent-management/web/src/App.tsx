import { useState, useEffect } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from './components/common/Layout';
import NetworkGraph from './components/NetworkGraph/NetworkGraph';
import NodeDetails from './components/NetworkGraph/NodeDetails';

interface NetworkData {
  nodes: any[];
  edges: any[];
}

function App() {
  const [networkData, setNetworkData] = useState<NetworkData>({
    nodes: [],
    edges: []
  });
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 加载网络数据
    fetch('http://localhost:8080/output/intent-network.json')
      .then(res => res.json())
      .then(data => {
        const elements = data.intents.map((intent: any) => ({
          data: {
            id: intent.id,
            label: intent.name,
            category: intent.category,
            color: getCategoryColor(intent.category),
            ...intent
          }
        })) as any[];

        const nodes = elements.filter((el: any) => el.group === 'nodes');
        const edges = elements.filter((el: any) => el.group === 'edges');

        setNetworkData({ nodes, edges });
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load network data:', err);
        setLoading(false);
      });
  }, []);

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'folder': '#f59e0b',
      'maven': '#10b981',
      'nodejs': '#3b82f6',
      'unknown': '#9e9e9e'
    };
    return colors[category] || '#9e9e9e';
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
  };

  const handleCloseDetails = () => {
    setSelectedNode(null);
  };

  return (
    <ConfigProvider locale={zhCN} theme={{
      token: {
        colorPrimary: '#6366f1',
        colorSuccess: '#10b981',
        colorWarning: '#f59e0b',
        colorError: '#ef4444',
      },
    }}>
      <Layout loading={loading}>
        <NetworkGraph
          nodes={networkData.nodes}
          edges={networkData.edges}
          onNodeClick={handleNodeClick}
        />
        <NodeDetails
          visible={!!selectedNode}
          node={selectedNode}
          onClose={handleCloseDetails}
        />
      </Layout>
    </ConfigProvider>
  );
}

export default App;
