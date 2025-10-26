'use client';

import { Suspense, useRef, useState, useEffect, MouseEvent as ReactMouseEvent, WheelEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider } from 'ethers';
import Header from '../../../component/Header';
import { bridgeToHedera, BridgeProgress } from '@/lib/bridgeToHedera';
import { sendBridgeNotification } from '@/lib/telegramNotify';
import TriggerPanel from './panel/TriggerPanel';
import AppEventPanel from './panel/AppEventPanel';
import TelegramPanel from './panel/TelegramPanel';
import NodePanel from './panel/NodePanel';
import TelegramCredentialModal from './triggerNode/TelegramCredentialModal';
import TelegramNodeConfig from '../../../component/TelegramNodeConfig';
import StartButton from './triggerNode/StartNode';
import AIAgentNode from './aiNode/aiAgent';
import AIAgentConfigPanel from './aiNode/AIAgentConfigPanel';
import IfElseNode from './ifelse/ifelse';
import IfElseConfigPanel from './ifelse/IfElseConfigPanel';
import BaseStartNode from './baseNode/baseStartNode';
import HederaStartNode from './hederaNode/hederaStartNode';
import AvailStartNode from './availNode/startAvailNode';
import AvailConfigPanel from './availNode/availConfig';
import TelegramNode from './telegram/telegramNode';
import PythNode from './triggerNode/pythNode';
import GmailNode from './gmailNode/gmail';
import { saveWorkflow, getWorkflow, createNewWorkflow, WorkflowData } from '@/lib/workflowStorage';
import AvailBridgeNode from '@/app/avail/AvailBridgeNode';
import AvailBridgeExecuteNode from '@/app/avail/AvailBridgeExecuteNode';
import { useAvailExecutor } from '@/app/avail/AvailExecutorWagmi';

// Loading component for Suspense fallback
function FlowPageLoading() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#0a0b0d'
    }}>
      <div style={{ color: '#fff', fontSize: '18px' }}>Loading workflow...</div>
    </div>
  );
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

interface Condition {
  id: string;
  expression: string;
  operator: string;
  value: string;
}

interface Node {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  parentId?: string; // ID of the parent node this connects from
  branch?: 'true' | 'false'; // For nodes connected to IfElse nodes
  data: {
    // Telegram node properties
    botToken?: string;
    botInfo?: {
      id?: number;
      [key: string]: unknown;
    };
    triggerType?: string;
    chatId?: string | number;
    icon?: string;
    color?: string;
    // AI Agent node properties
    chatModel?: string;
    memory?: string;
    remark?: string;
    prompt?: string;
    outputFormat?: boolean;
    fallbackMode?: boolean;
    telegramChatId?: string | number;
    // IfElse node properties
    conditions?: Condition[];
    convertTypes?: boolean;
    // Base node properties
    action?: string;
    contractAddress?: string;
    bridgeAmount?: string;
    recipientAddress?: string;
  };
}

function FlowPageContent() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const workflowId = searchParams.get('id');
  
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowData | null>(null);
  const [workflowTitle, setWorkflowTitle] = useState<string>('My workflow');
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [isTriggerPanelOpen, setIsTriggerPanelOpen] = useState(false);
  const [isAppEventPanelOpen, setIsAppEventPanelOpen] = useState(false);
  const [isTelegramPanelOpen, setIsTelegramPanelOpen] = useState(false);
  const [isNodePanelOpen, setIsNodePanelOpen] = useState(false);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [isNodeConfigOpen, setIsNodeConfigOpen] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [selectedTelegramAction, setSelectedTelegramAction] = useState<string>('');
  const [botToken, setBotToken] = useState<string>('');
  const [botInfo, setBotInfo] = useState<{ id?: number; [key: string]: unknown } | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<string>('');
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [isAIAgentConfigOpen, setIsAIAgentConfigOpen] = useState(false);
  const [selectedAIAgentNode, setSelectedAIAgentNode] = useState<Node | null>(null);
  const [isIfElseConfigOpen, setIsIfElseConfigOpen] = useState(false);
  const [selectedIfElseNode, setSelectedIfElseNode] = useState<Node | null>(null);
  const [selectedTelegramNode, setSelectedTelegramNode] = useState<Node | null>(null);
  const [isAvailConfigOpen, setIsAvailConfigOpen] = useState(false);
  const [selectedAvailNode, setSelectedAvailNode] = useState<Node | null>(null);
  const [parentNodeId, setParentNodeId] = useState<string | null>(null); // Track which node is adding a child
  const [parentBranch, setParentBranch] = useState<'true' | 'false' | null>(null); // Track which branch of IfElse node
  const [executingNodeId, setExecutingNodeId] = useState<string | null>(null); // Track which node is currently executing
  const [isExecuting, setIsExecuting] = useState(false); // Track if workflow is executing
  const [isBridging, setIsBridging] = useState(false); // Track if bridge is executing
  const [showBridgeModal, setShowBridgeModal] = useState(false); // Show bridge modal
  const [showPaymentNotification, setShowPaymentNotification] = useState(false); // Show payment notification
  const [showMetaMaskReminder, setShowMetaMaskReminder] = useState(false); // Show MetaMask reminder for Avail
  
  // Wallet connection
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  // Avail Executor
  const availExecutor = useAvailExecutor();
  
  // Bridge configuration (matching auto-bridge-base-to-hedera.js)
  const BRIDGE_CONFIG = {
    recipientAddress: '0xfEC6BB7506B4c06ddA315c8C12ED030eb05bdE28',
    amount: '0.0001', // Updated to match the script default
    telegramBotToken: '8315860340:AAHrM96vOHlZ8jRJtU6Q0GrHTZWIwjn2jA0',
    telegramChatId: '', // Will be populated from workflow data
  };

  // Handle node drag start
  const handleNodeMouseDown = (e: ReactMouseEvent<HTMLDivElement>, nodeId: string) => {
    e.stopPropagation();
    setDraggedNode(nodeId);
    
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        // Calculate offset from mouse to node position, accounting for transform
        const mouseX = (e.clientX - canvasRect.left - transform.x) / transform.scale;
        const mouseY = (e.clientY - canvasRect.top - transform.y) / transform.scale;
        setDragOffset({
          x: mouseX - node.position.x,
          y: mouseY - node.position.y,
        });
      }
    }
  };

  // Handle AI Agent node double click to open configuration
  const handleAIAgentDoubleClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      // Find parent node to get input data
      let parentNodeData = null;
      if (node.parentId) {
        const parentNode = nodes.find(n => n.id === node.parentId);
        if (parentNode) {
          parentNodeData = {
            type: parentNode.type,
            data: parentNode.data,
            name: parentNode.name,
          };
        }
      }
      
      // Add parent data to the selected node
      setSelectedAIAgentNode({
        ...node,
        parentNode: parentNodeData as {
          type: string;
          data: Record<string, unknown>;
          name: string;
        },
      } as Node & {
        parentNode: {
          type: string;
          data: Record<string, unknown>;
          name: string;
        };
      });
      setIsAIAgentConfigOpen(true);
    }
  };

  // Handle saving AI Agent configuration
  const handleSaveAIAgentConfig = (updatedData: Partial<Node['data']>) => {
    if (selectedAIAgentNode) {
      setNodes(prev => prev.map(node => 
        node.id === selectedAIAgentNode.id
          ? { ...node, data: { ...node.data, ...updatedData } }
          : node
      ));
    }
  };

  // Handle IfElse node double click to open configuration
  const handleIfElseDoubleClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedIfElseNode(node);
      setIsIfElseConfigOpen(true);
    }
  };

  // Handle Telegram Trigger node double click to open configuration
  const handleTelegramDoubleClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node && node.type === 'telegram-trigger') {
      // Set the node's data to the state
      setSelectedTelegramNode(node);
      setBotToken(node.data.botToken || '');
      setBotInfo(node.data.botInfo || null);
      setSelectedTelegramAction(node.data.triggerType || '');
      // Open the configuration panel
      setIsNodeConfigOpen(true);
    }
  };

  // Handle Avail node double click to open configuration
  const handleAvailDoubleClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedAvailNode(node);
      setIsAvailConfigOpen(true);
    }
  };

  // Handle saving IfElse configuration
  const handleSaveIfElseConfig = (updatedData: Partial<Node['data']>) => {
    if (selectedIfElseNode) {
      setNodes(prev => prev.map(node => 
        node.id === selectedIfElseNode.id
          ? { ...node, data: { ...node.data, ...updatedData } }
          : node
      ));
    }
  };

  // Handle saving Avail configuration
  const handleSaveAvailConfig = (updatedData: Partial<Node['data']>) => {
    if (selectedAvailNode) {
      setNodes(prev => prev.map(node => 
        node.id === selectedAvailNode.id
          ? { ...node, data: { ...node.data, ...updatedData } }
          : node
      ));
    }
  };

  // Quick bridge execution
  const handleQuickBridge = async () => {
    if (!walletClient || !isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    const recipient = prompt('Enter recipient address (Hedera):', '0xfEC6BB7506B4c06ddA315c8C12ED030eb05bdE28');
    if (!recipient) return;

    const amount = prompt('Enter amount (MyOFT):', '0.001');
    if (!amount) return;

    setIsBridging(true);

    try {
      const provider = new BrowserProvider(walletClient);

      const result = await bridgeToHedera(
        provider,
        {
          recipientAddress: recipient,
          amount: amount,
        },
        (progress: BridgeProgress) => {
          console.log('Bridge progress:', progress);
        }
      );

      if (result.success) {
        alert(`Bridge successful!\n\nTransaction: ${result.txHash}\n\nCross-chain delivery will take 2-5 minutes.\n\nTrack on: https://testnet.layerzeroscan.com/`);
      } else {
        alert(`Bridge failed: ${result.error}`);
      }
    } catch (error: unknown) {
      console.error('Bridge error:', error);
      alert(`Bridge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsBridging(false);
    }
  };

  // Execute workflow - light up nodes in sequence, skipping false branch nodes
  const handleExecuteWorkflow = async () => {
    if (isExecuting || nodes.length === 0) return;
    
    setIsExecuting(true);
    
    // Check if workflow contains Avail nodes
    const hasAvailNodes = nodes.some(
      (node) =>
        node.type === 'avail-bridge' || node.type === 'avail-bridge-execute'
    );

    if (hasAvailNodes) {
      // Show MetaMask reminder for Avail workflows
      setShowMetaMaskReminder(true);

      // Use Avail Executor for workflows with Avail nodes
      const result = await availExecutor.executeWorkflow(
        currentWorkflow?.id || 'temp-workflow-id',
        nodes.map(node => ({ ...node, title: node.name }))
      );

      setShowMetaMaskReminder(false);

      if (result.success) {
        console.log('✅ Avail workflow executed successfully');
      } else {
        console.error('❌ Avail workflow execution failed:', result.error);
        alert(`Workflow execution failed: ${result.error}`);
      }

      setIsExecuting(false);
      return;
    }
    
    // Build execution order based on node connections, only following TRUE branches
    const executionOrder: string[] = [];
    const visited = new Set<string>();
    
    // Find root nodes (nodes without parentId)
    const rootNodes = nodes.filter(node => !node.parentId);
    
    // BFS to get execution order, only following TRUE branches
    const queue = [...rootNodes];
    while (queue.length > 0) {
      const currentNode = queue.shift();
      if (!currentNode || visited.has(currentNode.id)) continue;
      
      visited.add(currentNode.id);
      executionOrder.push(currentNode.id);
      
      // Find children - only include nodes on TRUE branch or nodes without branch specification
      const children = nodes.filter(node => 
        node.parentId === currentNode.id && 
        (node.branch === 'true' || node.branch === undefined || node.branch === null)
      );
      queue.push(...children);
    }
    
    // Execute nodes in sequence with 1 second delay
    for (const nodeId of executionOrder) {
      const currentNode = nodes.find(n => n.id === nodeId);
      setExecutingNodeId(nodeId);
      
      // If this is a base or hedera node, execute the bridge
      if (currentNode?.type === 'base' || currentNode?.type === 'hedera') {
        console.log('🌉 Executing bridge for node:', currentNode.type, nodeId);
        await executeBridgeForNode(currentNode);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setExecutingNodeId(null);
    setIsExecuting(false);
  };

  // Execute bridge for a base node
  const executeBridgeForNode = async (node: Node) => {
    if (!walletClient || !isConnected) {
      console.error('Wallet not connected');
      setBridgeStatus('❌ Wallet not connected');
      setTimeout(() => setBridgeStatus(''), 3000);
      return;
    }

    setIsBridging(true);
    setBridgeStatus('🌉 Starting bridge...');

    try {
      const provider = new BrowserProvider(walletClient);

      // Get bridge configuration (you can customize this based on node data)
      const bridgeAmount = node.data?.bridgeAmount || BRIDGE_CONFIG.amount;
      const recipientAddress = node.data?.recipientAddress || BRIDGE_CONFIG.recipientAddress;

      console.log('🚀 Starting bridge:', { bridgeAmount, recipientAddress });

      const result = await bridgeToHedera(
        provider,
        {
          recipientAddress: recipientAddress,
          amount: bridgeAmount,
        },
        (progress: BridgeProgress) => {
          console.log('Bridge progress:', progress);
          setBridgeStatus(`🌉 ${progress.message}`);
        }
      );

      if (result.success && result.txHash) {
        console.log('✅ Bridge successful! TX:', result.txHash);
        setBridgeStatus('✅ Bridge successful! Sending Telegram notification...');
        
        // Find telegram chat ID from workflow
        // Priority: 1) From telegram message data, 2) From bot info, 3) Use bot's default chat
        const telegramNode = nodes.find(n => n.type === 'telegram-trigger');
        let chatId: string | number = '';
        
        // Try to get chat ID from various sources
        if (telegramNode?.data?.chatId) {
          chatId = telegramNode.data.chatId;
        } else if (telegramNode?.data?.botInfo?.id) {
          chatId = telegramNode.data.botInfo.id;
        } else {
          // Check AI Agent node for telegram output data
          const aiAgentNode = nodes.find(n => n.type === 'ai-agent');
          if (aiAgentNode?.data?.telegramChatId) {
            chatId = aiAgentNode.data.telegramChatId;
          }
        }

        console.log('📱 Sending Telegram notification to chat ID:', chatId || 'bot default');

        // Send Telegram notification
        // Note: If chatId is empty, the message will be sent to the bot's owner
        const finalChatId = chatId ? String(chatId) : '7350130312'; // Convert to string and use default if needed
        const notificationSent = await sendBridgeNotification(
          BRIDGE_CONFIG.telegramBotToken,
          finalChatId,
          result.txHash,
          bridgeAmount,
          'Base Sepolia',
          'Hedera Testnet'
        );

        if (notificationSent) {
          console.log('✅ Telegram notification sent!');
          setBridgeStatus('✅ Complete! Telegram notification sent!');
        } else {
          console.warn('⚠️ Failed to send Telegram notification');
          setBridgeStatus('✅ Bridge complete! (Telegram notification failed)');
        }

        // Clear status after 5 seconds
        setTimeout(() => setBridgeStatus(''), 5000);
      } else {
        console.error('❌ Bridge failed:', result.error);
        setBridgeStatus(`❌ Bridge failed: ${result.error}`);
        setTimeout(() => setBridgeStatus(''), 5000);
      }
    } catch (error: unknown) {
      console.error('Bridge error:', error);
      setBridgeStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setBridgeStatus(''), 5000);
    } finally {
      setIsBridging(false);
    }
  };

  // Handle mouse down for panning
  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    // Only pan with middle mouse button or space + left click
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      }));
    } else if (draggedNode) {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        // Calculate new position accounting for transform and scale
        const mouseX = (e.clientX - canvasRect.left - transform.x) / transform.scale;
        const mouseY = (e.clientY - canvasRect.top - transform.y) / transform.scale;
        
        setNodes(prev => prev.map(node => 
          node.id === draggedNode
            ? {
                ...node,
                position: {
                  x: mouseX - dragOffset.x,
                  y: mouseY - dragOffset.y,
                },
              }
            : node
        ));
      }
    }
  };

  // Handle mouse up to stop panning and dragging
  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNode(null);
  };

  // Handle zoom with mouse wheel
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.1, transform.scale + delta), 3);
    
    // Get mouse position relative to canvas
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate new position to zoom towards mouse
    const scaleRatio = newScale / transform.scale;
    const newX = mouseX - (mouseX - transform.x) * scaleRatio;
    const newY = mouseY - (mouseY - transform.y) * scaleRatio;
    
    setTransform({
      x: newX,
      y: newY,
      scale: newScale,
    });
  };

  // Reset view
  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  // Add node to canvas
  const handleAddNode = () => {
    // Check if we're editing an existing node
    if (selectedTelegramNode) {
      // Update existing node
      setNodes((prev) => prev.map(node => 
        node.id === selectedTelegramNode.id
          ? {
              ...node,
              data: {
                ...node.data,
                botToken: botToken,
                botInfo: botInfo || undefined,
                triggerType: selectedTelegramAction,
              }
            }
          : node
      ));
      console.log('Node updated:', selectedTelegramNode.id);
    } else {
      // Create new node
      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'telegram-trigger',
        name: 'Telegram Trigger',
        position: {
          x: 400 + (nodes.length * 50),
          y: 300 + (nodes.length * 50),
        },
        data: {
          botToken: botToken,
          botInfo: botInfo || undefined,
          triggerType: selectedTelegramAction,
          icon: 'telegram',
          color: '#0088cc',
        },
      };

      setNodes((prev) => [...prev, newNode]);
      console.log('Node added to canvas:', newNode);
    }

    setIsNodeConfigOpen(false);
    setSelectedTelegramNode(null);
    
    // Show success toast
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Load workflow on mount
  useEffect(() => {
    if (workflowId) {
      // Load existing workflow
      const workflow = getWorkflow(workflowId);
      if (workflow) {
        setCurrentWorkflow(workflow);
        setWorkflowTitle(workflow.title);
        setNodes((workflow.nodes || []) as Node[]);
        setTransform(workflow.transform || { x: 0, y: 0, scale: 1 });
        console.log('Loaded workflow:', workflow.title);
      }
    } else {
      // Create new workflow
      const newWorkflow = createNewWorkflow();
      setCurrentWorkflow(newWorkflow);
      setWorkflowTitle(newWorkflow.title);
      // Update URL with new workflow ID
      router.replace(`/flow?id=${newWorkflow.id}`);
    }
  }, []); // Run only once on mount

  // Auto-save workflow (every 3 seconds when there are changes)
  useEffect(() => {
    if (!currentWorkflow) return;

    const autoSaveInterval = setInterval(() => {
      const workflowData: WorkflowData = {
        ...currentWorkflow,
        title: workflowTitle,
        nodes,
        transform,
      };
      
      saveWorkflow(workflowData);
      setLastSaveTime(new Date());
    }, 3000); // Auto-save every 3 seconds

    return () => clearInterval(autoSaveInterval);
  }, [currentWorkflow, nodes, transform, workflowTitle]);

  // Save on unmount (when leaving the page)
  useEffect(() => {
    return () => {
      if (currentWorkflow) {
        const workflowData: WorkflowData = {
          ...currentWorkflow,
          title: workflowTitle,
          nodes,
          transform,
        };
        saveWorkflow(workflowData);
      }
    };
  }, [currentWorkflow, nodes, transform, workflowTitle]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Reset view with 'R' key
      if (e.key === 'r' || e.key === 'R') {
        resetView();
      }
      // Zoom in with '+'
      if (e.key === '+' || e.key === '=') {
        setTransform(prev => ({
          ...prev,
          scale: Math.min(prev.scale + 0.1, 3),
        }));
      }
      // Zoom out with '-'
      if (e.key === '-' || e.key === '_') {
        setTransform(prev => ({
          ...prev,
          scale: Math.max(prev.scale - 0.1, 0.1),
        }));
      }
      // Show payment notification with '1' key
      if (e.key === '1') {
        console.log('Key "1" pressed - showing payment notification');
        setShowPaymentNotification(true);
        setTimeout(() => setShowPaymentNotification(false), 5000);
      }
      // Manual save with Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentWorkflow) {
          const workflowData: WorkflowData = {
            ...currentWorkflow,
            title: workflowTitle,
            nodes,
            transform,
          };
          saveWorkflow(workflowData);
          setLastSaveTime(new Date());
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 2000);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentWorkflow, nodes, transform, workflowTitle]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Header */}
      <Header title="LinkedOut Flow" showBackButton={true} />

      {/* MetaMask Approval Reminder Banner */}
      {showMetaMaskReminder && (
        <div
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-lg shadow-2xl animate-pulse"
          style={{
            background:
              "linear-gradient(135deg, rgba(255, 140, 0, 0.95), rgba(255, 100, 0, 0.95))",
            border: "2px solid rgba(255, 200, 100, 0.6)",
            boxShadow: "0 8px 32px rgba(255, 140, 0, 0.5)",
            maxWidth: "500px",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                border: "2px solid rgba(255, 255, 255, 0.5)",
              }}
            >
              <svg
                className="w-7 h-7 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </div>
            <div>
              <p
                className="font-bold text-white mb-1"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: "16px",
                }}
              >
                ⚠️ Check Your MetaMask
              </p>
              <p className="text-sm text-white/90">
                Please approve the pending transaction(s) in your MetaMask extension
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Grid Background */}
        <div
          ref={canvasRef}
          className="absolute inset-0"
          style={{
            background: '#1a1a1f',
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: `${20 * transform.scale}px ${20 * transform.scale}px`,
            backgroundPosition: `${transform.x}px ${transform.y}px`,
            cursor: draggedNode ? 'grabbing' : isPanning ? 'grabbing' : 'grab',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Canvas Content - Transform wrapper */}
          <div
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: '0 0',
              width: '100%',
              height: '100%',
              position: 'relative',
            }}
          >
            {/* Render Nodes */}
            {nodes.map((node) => {
              console.log('Rendering node:', node.id, 'Type:', node.type);
              
              // Render AI Agent Node
              if (node.type === 'ai-agent') {
                return (
                  <div
                    key={node.id}
                    onDoubleClick={() => handleAIAgentDoubleClick(node.id)}
                  >
                    <AIAgentNode
                      id={node.id}
                      position={node.position}
                      isDragging={draggedNode === node.id}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      onDelete={() => {
                        setNodes((prev) => prev.filter((n) => n.id !== node.id));
                      }}
                      onAddConnection={() => {
                        setParentNodeId(node.id);
                        setIsNodePanelOpen(true);
                      }}
                      hasChildren={nodes.some(n => n.parentId === node.id)}
                      data={node.data}
                      isExecuting={executingNodeId === node.id}
                    />
                  </div>
                );
              }
              
              // Render If/Else Node
              if (node.type === 'if') {
                return (
                  <div 
                    key={node.id}
                    onDoubleClick={() => handleIfElseDoubleClick(node.id)}
                  >
                    <IfElseNode
                      id={node.id}
                      position={node.position}
                      isDragging={draggedNode === node.id}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      onDelete={() => {
                        setNodes((prev) => prev.filter((n) => n.id !== node.id));
                      }}
                      onAddConnection={(branch) => {
                        setParentNodeId(node.id);
                        setParentBranch(branch || null);
                        setIsNodePanelOpen(true);
                        console.log(`Opening NodePanel for ${branch} branch of IfElse node:`, node.id);
                      }}
                      hasTrueChild={nodes.some(n => n.parentId === node.id && n.branch === 'true')}
                      hasFalseChild={nodes.some(n => n.parentId === node.id && n.branch === 'false')}
                      data={node.data}
                      isExecuting={executingNodeId === node.id}
                    />
                  </div>
                );
              }
              
              // Render Base Node
              if (node.type === 'base') {
                return (
                  <div 
                    key={node.id}
                  >
                    <BaseStartNode
                      id={node.id}
                      position={node.position}
                      isDragging={draggedNode === node.id}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      onDelete={() => {
                        setNodes((prev) => prev.filter((n) => n.id !== node.id));
                      }}
                      onAddConnection={() => {
                        setParentNodeId(node.id);
                        setIsNodePanelOpen(true);
                      }}
                      hasChildren={nodes.some(n => n.parentId === node.id)}
                      data={node.data}
                      isExecuting={executingNodeId === node.id}
                    />
                  </div>
                );
              }
              
              // Render Hedera Node
              if (node.type === 'hedera') {
                return (
                  <div 
                    key={node.id}
                  >
                    <HederaStartNode
                      id={node.id}
                      position={node.position}
                      isDragging={draggedNode === node.id}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      onDelete={() => {
                        setNodes((prev) => prev.filter((n) => n.id !== node.id));
                      }}
                      onAddConnection={() => {
                        setParentNodeId(node.id);
                        setIsNodePanelOpen(true);
                      }}
                      hasChildren={nodes.some(n => n.parentId === node.id)}
                      data={node.data}
                      isExecuting={executingNodeId === node.id}
                    />
                  </div>
                );
              }
              
              // Render Avail Node
              if (node.type === 'avail') {
                return (
                  <div 
                    key={node.id}
                    onDoubleClick={() => handleAvailDoubleClick(node.id)}
                  >
                    <AvailStartNode
                      id={node.id}
                      position={node.position}
                      isDragging={draggedNode === node.id}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      onDelete={() => {
                        setNodes((prev) => prev.filter((n) => n.id !== node.id));
                      }}
                      onAddConnection={() => {
                        setParentNodeId(node.id);
                        setIsNodePanelOpen(true);
                      }}
                      onDoubleClick={() => handleAvailDoubleClick(node.id)}
                      hasChildren={nodes.some(n => n.parentId === node.id)}
                      data={node.data}
                      isExecuting={executingNodeId === node.id}
                    />
                  </div>
                );
              }
              
              // Render Telegram Notification Node
              if (node.type === 'telegram-notification') {
                return (
                  <div 
                    key={node.id}
                  >
                    <TelegramNode
                      id={node.id}
                      position={node.position}
                      isDragging={draggedNode === node.id}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      onDelete={() => {
                        setNodes((prev) => prev.filter((n) => n.id !== node.id));
                      }}
                      onAddConnection={() => {
                        setParentNodeId(node.id);
                        setIsNodePanelOpen(true);
                      }}
                      hasChildren={nodes.some(n => n.parentId === node.id)}
                      data={{
                        ...node.data,
                        chatId: node.data.chatId ? String(node.data.chatId) : undefined
                      }}
                      isExecuting={executingNodeId === node.id}
                    />
                  </div>
                );
              }
              
              // Render Pyth Network Node
              if (node.type === 'pyth-network') {
                return (
                  <div 
                    key={node.id}
                  >
                    <PythNode
                      id={node.id}
                      position={node.position}
                      isDragging={draggedNode === node.id}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      onDelete={() => {
                        setNodes((prev) => prev.filter((n) => n.id !== node.id));
                      }}
                      onAddConnection={() => {
                        setParentNodeId(node.id);
                        setIsNodePanelOpen(true);
                      }}
                      hasChildren={nodes.some(n => n.parentId === node.id)}
                      data={node.data}
                      isExecuting={executingNodeId === node.id}
                    />
                  </div>
                );
              }
              
              // Render Gmail Node
              if (node.type === 'gmail') {
                return (
                  <div 
                    key={node.id}
                  >
                    <GmailNode
                      id={node.id}
                      position={node.position}
                      isDragging={draggedNode === node.id}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      onDelete={() => {
                        setNodes((prev) => prev.filter((n) => n.id !== node.id));
                      }}
                      onAddConnection={() => {
                        setParentNodeId(node.id);
                        setIsNodePanelOpen(true);
                      }}
                      hasChildren={nodes.some(n => n.parentId === node.id)}
                      data={node.data}
                      isExecuting={executingNodeId === node.id}
                    />
                  </div>
                );
              }
              
              // Render Gmail Notification Node
              if (node.type === 'gmail-notification') {
                return (
                  <div 
                    key={node.id}
                  >
                    <GmailNode
                      id={node.id}
                      position={node.position}
                      isDragging={draggedNode === node.id}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      onDelete={() => {
                        setNodes((prev) => prev.filter((n) => n.id !== node.id));
                      }}
                      onAddConnection={() => {
                        setParentNodeId(node.id);
                        setIsNodePanelOpen(true);
                      }}
                      hasChildren={nodes.some(n => n.parentId === node.id)}
                      data={node.data}
                      isExecuting={executingNodeId === node.id}
                    />
                  </div>
                );
              }
              
              // Render Avail Bridge Node
              if (node.type === 'avail-bridge') {
                return (
                  <div 
                    key={node.id}
                    className="absolute"
                    style={{
                      left: `${node.position.x}px`,
                      top: `${node.position.y}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <AvailBridgeNode
                      node={{
                        id: node.id,
                        type: node.type,
                        title: node.name,
                        icon: String(node.data.icon) || '🔗',
                        position: node.position,
                        inputs: node.data,
                      }}
                      isLast={!nodes.some(n => n.parentId === node.id)}
                      onMouseDown={(e: React.MouseEvent) => handleNodeMouseDown(e, node.id)}
                      onDelete={(nodeId: string) => {
                        setNodes((prev) => prev.filter((n) => n.id !== nodeId));
                      }}
                      onUpdateInputs={(nodeId: string, inputs: Record<string, string>) => {
                        setNodes(prev => prev.map(n => 
                          n.id === nodeId ? { ...n, data: { ...n.data, ...inputs } } : n
                        ));
                      }}
                      onAddNode={() => {
                        setParentNodeId(node.id);
                        setIsNodePanelOpen(true);
                      }}
                    />
                  </div>
                );
              }
              
              // Render Avail Bridge & Execute Node
              if (node.type === 'avail-bridge-execute') {
                return (
                  <div 
                    key={node.id}
                    className="absolute"
                    style={{
                      left: `${node.position.x}px`,
                      top: `${node.position.y}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <AvailBridgeExecuteNode
                      node={{
                        id: node.id,
                        type: node.type,
                        title: node.name,
                        icon: String(node.data.icon) || '🚀',
                        position: node.position,
                        inputs: node.data,
                      }}
                      isLast={!nodes.some(n => n.parentId === node.id)}
                      onMouseDown={(e: React.MouseEvent) => handleNodeMouseDown(e, node.id)}
                      onDelete={(nodeId: string) => {
                        setNodes((prev) => prev.filter((n) => n.id !== nodeId));
                      }}
                      onUpdateInputs={(nodeId: string, inputs: Record<string, string>) => {
                        setNodes(prev => prev.map(n => 
                          n.id === nodeId ? { ...n, data: { ...n.data, ...inputs } } : n
                        ));
                      }}
                      onAddNode={() => {
                        setParentNodeId(node.id);
                        setIsNodePanelOpen(true);
                      }}
                    />
                  </div>
                );
              }
              
              // Render default Telegram Trigger Node
              const isNodeExecuting = executingNodeId === node.id;
              return (
              <div
                key={node.id}
                className="absolute"
                style={{
                  left: `${node.position.x}px`,
                  top: `${node.position.y}px`,
                  transform: 'translate(-50%, -50%)',
                  transition: draggedNode === node.id ? 'none' : 'all 0.3s ease',
                  pointerEvents: draggedNode && draggedNode !== node.id ? 'none' : 'auto',
                }}
                onDoubleClick={() => handleTelegramDoubleClick(node.id)}
              >
                {/* Main Node Card */}
                <div className="flex flex-col items-center">
                  {/* Node Card */}
                  <div
                    className="relative p-4 transition-all duration-300 group"
                    style={{
                      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                      border: '2px solid rgba(139, 92, 246, 0.4)',
                      width: '180px',
                      height: '180px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '32px',
                      cursor: draggedNode === node.id ? 'grabbing' : 'grab',
                      backdropFilter: 'blur(20px)',
                      boxShadow: isNodeExecuting ? `
                        0 0 80px rgba(139, 92, 246, 0.8),
                        0 0 120px rgba(139, 92, 246, 0.6),
                        0 10px 40px rgba(139, 92, 246, 0.5),
                        0 0 0 1px rgba(255, 255, 255, 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.3)
                      ` : `
                        0 10px 40px rgba(0, 0, 0, 0.4),
                        0 0 0 1px rgba(255, 255, 255, 0.05),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1),
                        0 0 60px rgba(139, 92, 246, 0.15)
                      `,
                    }}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  >
                    {/* Lightning Bolt Icon - Top Left */}
                    <div
                      className="absolute"
                      style={{
                        top: '14px',
                        left: '14px',
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          boxShadow: '0 0 20px rgba(239, 68, 68, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
                        }}
                      >
                        <svg 
                          className="w-4 h-4" 
                          fill="white" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                        </svg>
                      </div>
                    </div>

                    {/* Delete Button - Top Right */}
                    <button
                      className="absolute opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg p-2"
                      style={{
                        top: '12px',
                        right: '12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        backdropFilter: 'blur(10px)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setNodes((prev) => prev.filter((n) => n.id !== node.id));
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                      }}
                    >
                      <svg 
                        className="w-4 h-4" 
                        fill="none" 
                        stroke="#ef4444" 
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Telegram Icon - Center */}
                    <div
                      className="w-28 h-28 rounded-full flex items-center justify-center relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        boxShadow: '0 8px 24px rgba(139, 92, 246, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <svg className="w-16 h-16 relative z-10" fill="white" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.654-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                      </svg>
                      {/* Glow effect */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), transparent)',
                      }} />
                    </div>

                    {/* Lightning Icon - Left Side (Execute Workflow Button) */}
                    <div
                      className="absolute group"
                      style={{
                        left: '-40px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    >
                      <button
                        className="relative transition-all duration-300 hover:scale-110 rounded-full"
                        style={{
                          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))',
                          border: '2px solid rgba(239, 68, 68, 0.4)',
                          boxShadow: '0 0 20px rgba(239, 68, 68, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)',
                          cursor: 'pointer',
                          backdropFilter: 'blur(10px)',
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Execute workflow triggered for node:', node.id);
                          // Add your workflow execution logic here
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.2))';
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
                          e.currentTarget.style.boxShadow = '0 0 30px rgba(239, 68, 68, 0.6), 0 2px 12px rgba(0, 0, 0, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))';
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                          e.currentTarget.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)';
                        }}
                      >
                        <div className="w-7 h-7 rounded-full flex items-center justify-center">
                          <svg 
                            className="w-4 h-4" 
                            fill="#ef4444" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                          </svg>
                        </div>
                      </button>
                      
                      {/* Tooltip on hover */}
                      <div
                        className="absolute opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                        style={{
                          left: '-10px',
                          top: '50%',
                          transform: 'translate(-100%, -50%)',
                          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))',
                          border: '1px solid rgba(239, 68, 68, 0.5)',
                          borderRadius: '8px',
                          padding: '8px 14px',
                          color: '#e0e8f0',
                          fontSize: '12px',
                          fontFamily: "'Orbitron', sans-serif",
                          fontWeight: '600',
                          backdropFilter: 'blur(20px)',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                          zIndex: 1000,
                          letterSpacing: '0.05em',
                        }}
                      >
                        EXECUTE WORKFLOW
                      </div>
                    </div>

                    {/* Connection Point - Right Side */}
                    {!nodes.some(n => n.parentId === node.id) && (
                      <div
                        className="absolute flex items-center"
                        style={{
                          right: '-100px', //adjust connection line
                          top: '50%', 
                          transform: 'translateY(-50%)',
                        }}
                      >
                        {/* Glow Circle */}
                        <div
                          className="w-6 h-6 rounded-full transition-all duration-300"
                          style={{
                            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                            border: '2px solid rgba(139, 92, 246, 0.5)',
                            boxShadow: '0 0 20px rgba(139, 92, 246, 0.6), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                          }}
                        />
                        
                        {/* Connecting Line */}
                        <div
                          style={{
                            width: '60px',
                            height: '2px',
                            background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.6), rgba(139, 92, 246, 0.3))',
                            boxShadow: '0 0 10px rgba(139, 92, 246, 0.4)',
                          }}
                        />

                        {/* Plus Button */}
                        <button
                          className="flex items-center justify-center rounded-lg transition-all duration-300"
                          style={{
                            width: '34px',
                            height: '34px',
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))',
                            border: '2px solid rgba(139, 92, 246, 0.4)',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setParentNodeId(node.id);
                            setIsNodePanelOpen(true);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.2))';
                            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))';
                            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="#a78bfa" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Text Below Card */}
                  <div className="mt-5 text-center">
                    <h3
                      className="font-bold mb-1 tracking-wide"
                      style={{
                        color: '#e0e8f0',
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: '15px',
                        textShadow: '0 0 10px rgba(139, 92, 246, 0.3)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      TELEGRAM TRIGGER
                    </h3>
                    <p
                      className="text-xs"
                      style={{
                        color: '#a78bfa',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: '400',
                      }}
                    >
                      {node.data.triggerType?.replace(/-/g, ' ').toUpperCase() || 'MESSAGE'}
                    </p>
                  </div>
                </div>
              </div>
              );
            })}

            {/* Start Button - Only show if no nodes */}
            {nodes.length === 0 && (
              <StartButton 
                transform={transform} 
                onClick={() => setIsTriggerPanelOpen(true)}
                onAddConnection={() => {
                  setParentNodeId('start-button');
                  setIsTriggerPanelOpen(true);
                }}
                hasChildren={nodes.some(n => n.parentId === 'start-button')}
              />
            )}

            {/* Connection Lines - SVG */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            >
              {nodes.map((node) => {
                if (!node.parentId) return null;
                
                // Find parent node
                const parentNode = nodes.find(n => n.id === node.parentId);
                if (!parentNode) return null;

                // Calculate connection points based on node type
                let startX, startY, endX, endY;
                
                // Parent node output point (right side)
                if (parentNode.type === 'telegram-trigger') {
                  startX = parentNode.position.x + 87; // Extended right edge + connection offset
                  startY = parentNode.position.y - 10; // Move up a bit
                } else if (parentNode.type === 'ai-agent') {
                  startX = parentNode.position.x + 217; // Half width + extended connection offset (moved right)
                  startY = parentNode.position.y - 20; // Move up more
                } else if (parentNode.type === 'if') {
                  // IfElse node has two branches: true (30% from top) and false (70% from top)
                  // Node is 160px tall, positioned with center at position.y
                  // Connection points are at right: -5px from right edge
                  startX = parentNode.position.x + 80 - 60 + 60; // Half width (80) + right offset + line width (60)
                  
                  if (node.branch === 'true') {
                    // True branch is at 30% from top
                    // Node height is 160px, center is at position.y
                    // 30% from top = -80 (half height) + 48 (30% of 160) = -32, moved up by 20px
                    startY = parentNode.position.y - 52;
                  } else if (node.branch === 'false') {
                    // False branch is at 70% from top
                    // 70% from top = -80 (half height) + 112 (70% of 160) = +32, moved up by 20px
                    startY = parentNode.position.y + 12;
                  } else {
                    startY = parentNode.position.y - 10; // Default fallback
                  }
                } else if (parentNode.type === 'base') {
                  // Base node: 420px wide, gray circle (w-5 h-5 = 20px) at right: -120px
                  // Center is at position.x, so right edge is at position.x + 210
                  // Gray circle is 120px beyond right edge: position.x + 210 + 120 + 10 (center of 20px circle)
                  startX = parentNode.position.x + 210 + 120 + 10;
                  startY = parentNode.position.y; // Center of the node (50% top position)
                } else if (parentNode.type === 'hedera') {
                  // Hedera node: Same as Base node - 420px wide
                  startX = parentNode.position.x + 210 + 120 + 10;
                  startY = parentNode.position.y;
                } else if (parentNode.type === 'avail') {
                  // Avail node: Same as Base node - 420px wide
                  startX = parentNode.position.x + 210 + 120 + 10;
                  startY = parentNode.position.y;
                } else if (parentNode.type === 'telegram-notification') {
                  // Telegram notification node: 260px wide, connection at right: -100px
                  // Center is at position.x, so right edge is at position.x + 130
                  // Connection point is 100px further right + 60px line: position.x + 130 + 100 + 60
                  startX = parentNode.position.x + 130 + 100 + 60;
                  startY = parentNode.position.y; // Center of the node
                } else if (parentNode.type === 'pyth-network') {
                  // Pyth Network node: 160px wide, connection at right: -100px
                  // Center is at position.x, so right edge is at position.x + 80
                  // Gray circle (w-5 h-5 = 20px) is at the right connection point
                  // Circle center is at: position.x + 80 (right edge) + 10 (center of 20px circle)
                  startX = parentNode.position.x + 80; // Move left a bit
                  startY = parentNode.position.y - 30; // Move up
                } else if (parentNode.type === 'gmail' || parentNode.type === 'gmail-notification') {
                  // Gmail node: 160px wide, connection at right: -100px (similar to Pyth Network)
                  // Center is at position.x, so right edge is at position.x + 80
                  startX = parentNode.position.x + 80;
                  startY = parentNode.position.y - 30; // Move up
                } else {
                  startX = parentNode.position.x + 120;
                  startY = parentNode.position.y - 10;
                }
                
                // Child node input point (left side)
                if (node.type === 'telegram-trigger') {
                  endX = node.position.x - 87; // Move to the right
                  endY = node.position.y - 30; // Move up more
                } else if (node.type === 'ai-agent') {
                  endX = node.position.x - 200 - 10; // Half width + left connection point (moved right)
                  endY = node.position.y - 20; // Move up more
                } else if (node.type === 'if') {
                  // IfElse node: 160px wide, left connection at -10px from left edge
                  // Center is at position.x, so left edge is at position.x - 80
                  // Gray circle (w-5 h-5 = 20px) at left: -10px
                  // Circle center is at: position.x - 80 (left edge) - 10 + 10 (center of circle) = position.x - 80
                  endX = node.position.x - 80;
                  endY = node.position.y - 30; // Move up
                } else if (node.type === 'base') {
                  // Base node: 420px wide, left connection at -10px from left edge
                  // Center is at position.x, so left edge is at position.x - 210
                  // Connection point moved to the right
                  endX = node.position.x - 220 + 10;
                  endY = node.position.y; // Center of the node (50% top position)
                } else if (node.type === 'hedera') {
                  // Hedera node: Same as Base node - 420px wide
                  endX = node.position.x - 220 + 10;
                  endY = node.position.y;
                } else if (node.type === 'avail') {
                  // Avail node: Same as Base node - 420px wide
                  endX = node.position.x - 220 + 10;
                  endY = node.position.y;
                } else if (node.type === 'telegram-notification') {
                  // Telegram notification node: 160px wide, left connection at -10px from left edge
                  // Center is at position.x, so left edge is at position.x - 80
                  // Connection point is 10px further left: position.x - 80 - 10 = -90
                  endX = node.position.x - 80 - 10;
                  endY = node.position.y - 30; // Move up from center
                } else if (node.type === 'pyth-network') {
                  // Pyth Network node: 160px wide, left connection at -10px from left edge
                  // Center is at position.x, so left edge is at position.x - 80
                  // Connection point is 10px further left: position.x - 80 - 10 = -90
                  endX = node.position.x - 80 - 10;
                  endY = node.position.y - 30; // Move up from center
                } else if (node.type === 'gmail' || node.type === 'gmail-notification') {
                  // Gmail node: 160px wide, left connection at -10px from left edge (similar to Pyth Network)
                  // Center is at position.x, so left edge is at position.x - 80
                  // Connection point is 10px further left: position.x - 80 - 10 = -90
                  endX = node.position.x - 80 - 10;
                  endY = node.position.y - 30; // Move up from center
                } else {
                  endX = node.position.x - 100;
                  endY = node.position.y - 30; // Move up more
                }

                // Create a smooth curve
                const midX = (startX + endX) / 2;

                return (
                  <path
                    key={`connection-${node.id}`}
                    d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                    stroke="url(#connectionGradient)"
                    strokeWidth="3"
                    fill="none"
                    style={{
                      filter: 'drop-shadow(0 2px 8px rgba(139, 92, 246, 0.4))',
                    }}
                  />
                );
              })}
              
              {/* Gradient Definition */}
              <defs>
                <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
                  <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.8 }} />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Controls Overlay */}
        <div
          className="absolute top-4 right-4 flex flex-col gap-2"
          style={{ zIndex: 10 }}
        >
          {/* Zoom Controls */}
          <div
            className="flex flex-col gap-1 p-2 rounded-lg"
            style={{
              background: 'rgba(20, 20, 25, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <button
              onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale + 0.1, 3) }))}
              className="px-3 py-2 rounded transition-all hover:scale-105"
              style={{
                background: 'rgba(60, 60, 70, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#e0e8f0',
                fontSize: '18px',
                fontWeight: 'bold',
              }}
            >
              +
            </button>
            <div
              className="text-center py-1"
              style={{
                color: '#e0e8f0',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            >
              {Math.round(transform.scale * 100)}%
            </div>
            <button
              onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale - 0.1, 0.1) }))}
              className="px-3 py-2 rounded transition-all hover:scale-105"
              style={{
                background: 'rgba(60, 60, 70, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#e0e8f0',
                fontSize: '18px',
                fontWeight: 'bold',
              }}
            >
              −
            </button>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetView}
            className="px-3 py-2 rounded-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
            style={{
              background: 'rgba(20, 20, 25, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#e0e8f0',
              fontSize: '12px',
              fontFamily: "'Inter', sans-serif",
              backdropFilter: 'blur(10px)',
            }}
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            Reset
          </button>
        </div>

        {/* Info Overlay */}
        <div
          className="absolute bottom-4 left-4 px-4 py-2 rounded-lg flex items-center gap-4"
          style={{
            background: 'rgba(20, 20, 25, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#9fb5cc',
            fontSize: '12px',
            fontFamily: "'Inter', sans-serif",
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: '#10b981',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
            <span>Auto-save active</span>
          </div>
          <span>|</span>
          <span>Position: {Math.round(transform.x)}, {Math.round(transform.y)}</span>
          <span>|</span>
          <span>Zoom: {Math.round(transform.scale * 100)}%</span>
          <span>|</span>
          <span>Nodes: {nodes.length}</span>
        </div>

        {/* Workflow Title */}
        <div
          className="absolute top-4 left-4 px-4 py-2 rounded-lg"
          style={{
            background: 'rgba(20, 20, 25, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            zIndex: 10,
          }}
        >
          <input
            type="text"
            value={workflowTitle}
            onChange={(e) => setWorkflowTitle(e.target.value)}
            className="bg-transparent outline-none text-lg font-semibold"
            style={{
              color: '#e0e8f0',
              fontFamily: "'Inter', sans-serif",
              minWidth: '200px',
            }}
            placeholder="Workflow name..."
          />
        </div>

        {/* Execute and Add Node FABs - Show if nodes exist */}
        {nodes.length > 0 && (
          <div className="absolute bottom-4 right-4 flex flex-col gap-3" style={{ zIndex: 10 }}>
            {/* Execute Button */}
            <button
              onClick={handleExecuteWorkflow}
              disabled={isExecuting}
              className="p-4 rounded-full shadow-xl transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isExecuting 
                  ? 'linear-gradient(135deg, #6b7280, #4b5563)'
                  : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                boxShadow: isExecuting 
                  ? '0 8px 24px rgba(107, 114, 128, 0.4)'
                  : '0 8px 24px rgba(139, 92, 246, 0.4)',
              }}
              title="Execute Workflow (skips false branches)"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
              </svg>
            </button>
            
            {/* Bridge Button */}
            <button
              onClick={handleQuickBridge}
              disabled={isBridging || !isConnected}
              className="p-4 rounded-full shadow-xl transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isBridging 
                  ? 'linear-gradient(135deg, #6b7280, #4b5563)'
                  : 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                boxShadow: isBridging 
                  ? '0 8px 24px rgba(107, 114, 128, 0.4)'
                  : '0 8px 24px rgba(245, 158, 11, 0.4)',
              }}
              title={!isConnected ? "Connect wallet to bridge" : "Bridge tokens to Hedera"}
            >
              {isBridging ? (
                <div className="w-6 h-6 border-4 border-t-white border-gray-300 rounded-full animate-spin"></div>
              ) : (
                <span className="text-2xl">🌉</span>
              )}
            </button>
            
            {/* Add Node Button */}
            <button
              onClick={() => setIsTriggerPanelOpen(true)}
              className="p-4 rounded-full shadow-xl transition-all hover:scale-110 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
              }}
              title="Add Node"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        )}

        {/* Success Toast */}
        {showSuccessToast && (
          <div
            className="absolute top-20 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-bounce"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              zIndex: 50,
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Node added to canvas successfully!
          </div>
        )}

        {/* Bridge Status Toast */}
        {bridgeStatus && (
          <div
            className="absolute top-20 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3"
            style={{
              background: bridgeStatus.includes('❌') 
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : bridgeStatus.includes('✅')
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              zIndex: 50,
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: '600',
              maxWidth: '500px',
            }}
          >
            {!bridgeStatus.includes('❌') && !bridgeStatus.includes('✅') && (
              <div className="w-5 h-5 border-3 border-t-white border-white/30 rounded-full animate-spin"></div>
            )}
            <span>{bridgeStatus}</span>
          </div>
        )}

        {/* Payment Success Notification */}
        {showPaymentNotification && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 100,
              }}
              onClick={() => setShowPaymentNotification(false)}
            />
            
            {/* Notification Card */}
            <div
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-10 py-8 rounded-2xl shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                zIndex: 101,
                fontFamily: "'Inter', sans-serif",
                maxWidth: '900px',
                width: '95%',
                minWidth: '600px',
                boxShadow: '0 20px 60px rgba(16, 185, 129, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="flex items-start gap-4">
                <svg className="w-8 h-8 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Payment Successfully!</h3>
                  <p className="text-sm mb-3 opacity-90">Your transaction has been confirmed on the blockchain.</p>
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <span className="text-xs opacity-75 block mb-1">Transaction hash:</span>
                    <a
                      href="https://sepolia.basescan.org/tx/0x01e93cf6340edc04ca042771fb5629bb3e2e1422f43c14c95e48ee4f825f909c"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono underline hover:opacity-80 transition-opacity flex items-center gap-2"
                      style={{ color: '#e0f2fe' }}
                    >
                      <span>0x01e93cf6340edc04ca042771fb5629bb3e2e1422f43c14c95e48ee4f825f909c</span>
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentNotification(false)}
                  className="flex-shrink-0 hover:bg-white/10 rounded-lg p-1 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Fonts */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
      `}</style>

      {/* Trigger Panel */}
      <TriggerPanel
        isOpen={isTriggerPanelOpen}
        onClose={() => setIsTriggerPanelOpen(false)}
        onSelectTrigger={(trigger) => {
          setSelectedTrigger(trigger);
          console.log('Selected trigger:', trigger);
          
          // If "app-event" is selected, open the AppEventPanel
          if (trigger === 'app-event') {
            setIsTriggerPanelOpen(false);
            setIsAppEventPanelOpen(true);
          }
        }}
      />

      {/* App Event Panel */}
      <AppEventPanel
        isOpen={isAppEventPanelOpen}
        onClose={() => setIsAppEventPanelOpen(false)}
        onBack={() => {
          setIsAppEventPanelOpen(false);
          setIsTriggerPanelOpen(true);
        }}
        onSelectApp={(appId) => {
          console.log('Selected app:', appId);
          
          // If "telegram" is selected, open the TelegramPanel
          if (appId === 'telegram') {
            setIsAppEventPanelOpen(false);
            setIsTelegramPanelOpen(true);
          }
          
          // If "gmail" is selected, create a Gmail node
          if (appId === 'gmail') {
            const newNode: Node = {
              id: `node-${Date.now()}`,
              type: 'gmail',
              name: 'Gmail',
              position: {
                x: 400 + (nodes.length * 50),
                y: 300 + (nodes.length * 50),
              },
              data: {
                icon: 'gmail',
                color: '#EA4335',
              },
            };
            
            setNodes((prev) => [...prev, newNode]);
            setIsAppEventPanelOpen(false);
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
          }
          
          // If "avail" is selected, let user choose between bridge or bridge-execute
          if (appId === 'avail') {
            // For now, create a simple bridge node
            // You can expand this to show a submenu for bridge vs bridge-execute
            const newNode: Node = {
              id: `node-${Date.now()}`,
              type: 'avail-bridge',
              name: 'Avail Bridge',
              position: {
                x: 400 + (nodes.length * 50),
                y: 300 + (nodes.length * 50),
              },
              parentId: parentNodeId || undefined,
              branch: parentBranch || undefined,
              data: {
                icon: 'avail',
                color: '#00C896',
              },
            };
            
            setNodes((prev) => [...prev, newNode]);
            setIsAppEventPanelOpen(false);
            setParentNodeId(null);
            setParentBranch(null);
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
          }
        }}
      />

      {/* Telegram Panel */}
      <TelegramPanel
        isOpen={isTelegramPanelOpen}
        onClose={() => setIsTelegramPanelOpen(false)}
        onBack={() => {
          setIsTelegramPanelOpen(false);
          setIsAppEventPanelOpen(true);
        }}
        onSelectAction={(actionId) => {
          console.log('Selected Telegram action:', actionId);
          setSelectedTelegramAction(actionId);
          setIsTelegramPanelOpen(false);
          setIsCredentialModalOpen(true);
        }}
      />

      {/* Telegram Credential Modal */}
      <TelegramCredentialModal
        isOpen={isCredentialModalOpen}
        onClose={() => setIsCredentialModalOpen(false)}
        onSubmit={(token: string, info: { id?: number; [key: string]: unknown }) => {
          console.log('Bot token submitted:', token);
          console.log('Bot info:', info);
          setBotToken(token);
          setBotInfo(info);
          setIsCredentialModalOpen(false);
          setIsNodeConfigOpen(true);
        }}
      />

      {/* Telegram Node Configuration */}
      <TelegramNodeConfig
        isOpen={isNodeConfigOpen}
        onClose={() => {
          setIsNodeConfigOpen(false);
          setBotToken('');
          setBotInfo(null);
          setSelectedTelegramAction('');
          setSelectedTelegramNode(null);
        }}
        onAddNode={handleAddNode}
        triggerType={selectedTelegramAction}
        botToken={botToken}
        botInfo={botInfo}
      />

      {/* Node Panel */}
      <NodePanel
        isOpen={isNodePanelOpen}
        onClose={() => {
          setIsNodePanelOpen(false);
          setParentNodeId(null);
          setParentBranch(null);
        }}
        onAddNode={(nodeType) => {
          console.log('Adding node from NodePanel:', nodeType);
          console.log('Parent branch:', parentBranch);
          
          // Calculate position relative to parent node
          let newPosition = { x: 400 + (nodes.length * 50), y: 300 + (nodes.length * 50) };
          
          if (parentNodeId) {
            const parentNode = nodes.find(n => n.id === parentNodeId);
            if (parentNode) {
              // Position new node to the right of parent
              // If it's an IfElse node, position based on branch
              if (parentNode.type === 'if' && parentBranch) {
                newPosition = {
                  x: parentNode.position.x + 400,
                  y: parentNode.position.y + (parentBranch === 'true' ? -100 : 100),
                };
              } else {
                newPosition = {
                  x: parentNode.position.x + 400,
                  y: parentNode.position.y,
                };
              }
            }
          }
          
          // Create a new node based on the selected node type
          console.log('Creating new node with type:', nodeType.id, 'NodeType object:', nodeType);
          
          // Handle Avail nodes specifically
          if (nodeType.id === 'avail-bridge' || nodeType.id === 'avail-bridge-execute') {
            const newNode: Node = {
              id: `node-${Date.now()}`,
              type: nodeType.id,
              name: nodeType.title,
              position: newPosition,
              parentId: parentNodeId || undefined,
              branch: parentBranch || undefined,
              data: {
                icon: nodeType.id === 'avail-bridge' ? '🔗' : '🚀',
                color: '#00C896',
              },
            };
            
            setNodes((prev) => [...prev, newNode]);
            setIsNodePanelOpen(false);
            setParentNodeId(null);
            setParentBranch(null);
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
            return;
          }
          
          const newNode: Node = {
            id: `node-${Date.now()}`,
            type: nodeType.id,
            name: nodeType.title,
            position: newPosition,
            parentId: parentNodeId || undefined,
            branch: parentBranch || undefined,
            data: {
              icon: nodeType.icon,
              color: '#10b981',
            },
          };

          setNodes((prev) => [...prev, newNode]);
          setIsNodePanelOpen(false);
          setParentNodeId(null);
          setParentBranch(null);
          
          // Show success toast
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 3000);
        }}
      />

      {/* AI Agent Configuration Panel */}
      <AIAgentConfigPanel
        isOpen={isAIAgentConfigOpen}
        onClose={() => {
          setIsAIAgentConfigOpen(false);
          setSelectedAIAgentNode(null);
        }}
        nodeData={selectedAIAgentNode?.data}
        onSave={handleSaveAIAgentConfig}
      />

      {/* If/Else Configuration Panel */}
      <IfElseConfigPanel
        isOpen={isIfElseConfigOpen}
        onClose={() => {
          setIsIfElseConfigOpen(false);
          setSelectedIfElseNode(null);
        }}
        nodeData={selectedIfElseNode?.data}
        onSave={handleSaveIfElseConfig}
      />

      {/* Avail Configuration Panel */}
      <AvailConfigPanel
        isOpen={isAvailConfigOpen}
        onClose={() => {
          setIsAvailConfigOpen(false);
          setSelectedAvailNode(null);
        }}
        nodeData={selectedAvailNode?.data}
        onSave={handleSaveAvailConfig}
      />
    </div>
  );
}

// Main export with Suspense wrapper
export default function FlowPage() {
  return (
    <Suspense fallback={<FlowPageLoading />}>
      <FlowPageContent />
    </Suspense>
  );
}
