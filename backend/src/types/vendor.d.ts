// Stub declarations para pacotes externos (instalados via package.json, stubs para TS compile)

declare module 'firebase-admin' {
  interface App {}
  const apps: App[];
  function initializeApp(options: any): App;
  function credential(): any;
  namespace credential {
    function cert(serviceAccount: any): any;
  }
  function messaging(): {
    send(message: any): Promise<string>;
  };
}

declare module 'web-push' {
  interface PushSubscription {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }
  function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  function sendNotification(subscription: PushSubscription, payload: string, options?: any): Promise<any>;
}

declare module 'socket.io' {
  class Server {
    to(room: string): { emit(event: string, data?: any): void };
    emit(event: string, data?: any): void;
  }
  class Socket {
    id: string;
    data: Record<string, any>;
    handshake: { auth: Record<string, any>; headers: Record<string, string> };
    join(room: string): Promise<void>;
    leave(room: string): void;
    to(room: string): { emit(event: string, data?: any): void };
    emit(event: string, data?: any): boolean;
    disconnect(): void;
  }
}

declare module '@nestjs/websockets' {
  function WebSocketGateway(options?: any): ClassDecorator;
  function WebSocketServer(): PropertyDecorator;
  function SubscribeMessage(event: string): MethodDecorator;
  function MessageBody(): ParameterDecorator;
  function ConnectedSocket(): ParameterDecorator;
  interface OnGatewayConnection { handleConnection(client: any, ...args: any[]): any; }
  interface OnGatewayDisconnect { handleDisconnect(client: any): any; }
  interface OnGatewayInit { afterInit(server: any): any; }
}

declare module '@nestjs/platform-socket.io' {
  class IoAdapter {
    constructor(app?: any);
    // WebSocketAdapter interface (inherited via AbstractWsAdapter)
    create(port: number, options?: any): any;
    createIOServer(port: number, options?: any): any;
    bindClientConnect(server: any, callback: (...args: any[]) => void): void;
    bindMessageHandlers(client: any, handlers: any[], transform: any): void;
    close(server: any): Promise<void>;
  }
}

declare module '@socket.io/redis-adapter' {
  function createAdapter(pubClient: any, subClient: any, opts?: any): any;
}

// Instalar manualmente com npm v8-10 ou yarn: npm install @nestjs/swagger
declare module '@nestjs/swagger' {
  function ApiProperty(options?: any): PropertyDecorator;
  function ApiTags(...tags: string[]): ClassDecorator & MethodDecorator;
  function ApiOperation(options: { summary?: string; description?: string }): MethodDecorator;
  function ApiResponse(options: { status: number; description?: string; type?: any }): MethodDecorator;
  function ApiBearerAuth(name?: string): ClassDecorator & MethodDecorator;
  function ApiBody(options: { type?: any; description?: string }): MethodDecorator;
  function ApiParam(options: { name: string; description?: string; type?: any }): MethodDecorator;
  function ApiQuery(options: { name: string; description?: string; required?: boolean; type?: any }): MethodDecorator;
  class DocumentBuilder {
    setTitle(title: string): this;
    setDescription(description: string): this;
    setVersion(version: string): this;
    addBearerAuth(options?: any, name?: string): this;
    addTag(name: string, description?: string): this;
    build(): any;
  }
  class SwaggerModule {
    static createDocument(app: any, config: any, options?: any): any;
    static setup(path: string, app: any, document: any, options?: any): void;
  }
}
