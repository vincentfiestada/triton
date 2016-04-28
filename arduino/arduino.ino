/* Code for Arduino - Compile with ACEDuino IDE + e-gizmo etherShield drivers */

#include "etherShield.h"
#include "ip_arp_udp_tcp.c"
#define SYNACK_TIMEOUT 5

#define BUFFER_SIZE 700
#define trigPin 7
#define echoPin 6
// You can get a token from GET /api/device/:id/token (or just open the device page on the app)
// This token will not expire and will only become invalid if the server-side secrey key changes
// For more convenient token refreshing, the token can be stored in an SD-card
#define TOKEN "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU3MWQ4YmQxZTk3ODZjZTgyNzg4YmVkMiIsImlhdCI6MTQ2MTcyOTU5OCwiaXNzIjoicG9zZWlkb24ifQ.bwKlj-FCzxd4WbZGmUZjl3p358ouNUqXJzd3CCepy7E"

// please modify the following lines. mac and ip have to be unique
// in your local area network. You can not have the same numbers in
// two devices:
static uint8_t mymac[6] = {0x54,0x55,0x58,0x10,0x00,0x24}; 
static uint8_t myip[4] = {192,168,1,88};
static uint16_t my_port = 1200; // client port

// client_ip - modify it when you have multiple client on the network
// for server to distinguish each ethershield client
static char client_ip[] = "192.168.1.88";

// server settings - modify the service ip to your own server
static uint8_t dest_ip[4]={192,168,1,7};
static uint8_t dest_port = 80;
static uint8_t dest_mac[6]; // This will be filled in later

enum CLIENT_STATE
{  
   IDLE, ARP_SENT, ARP_REPLY, SYNC_SENT
};
 
static CLIENT_STATE client_state;

static uint8_t client_data_ready;

static uint8_t syn_ack_timeout;

static uint8_t capacity_sent;

static uint8_t lingering = 0;

static uint8_t buf[BUFFER_SIZE+1];

static uint16_t level = 99; // Distance of sensor from water surface

long duration, distance;

EtherShield es = EtherShield();

// prepare the webpage by writing the data to the tcp send buffer
uint16_t testRequest(uint8_t *buf);
void client_process(void);

void setup()
{
  
        Serial.begin(9600);
  
        /*initialize enc28j60*/
        es.ES_enc28j60Init(mymac);
        es.ES_enc28j60clkout(2); // change clkout from 6.25MHz to 12.5MHz
        delay(10);
        
        /* Magjack leds configuration, see enc28j60 datasheet, page 11 */
        // LEDA=greed LEDB=yellow
        //
        // 0x880 is PHLCON LEDB=on, LEDA=on
        // enc28j60PhyWrite(PHLCON,0b0000 1000 1000 00 00);
        es.ES_enc28j60PhyWrite(PHLCON,0x880);
        delay(500);
        //
        // 0x990 is PHLCON LEDB=off, LEDA=off
        // enc28j60PhyWrite(PHLCON,0b0000 1001 1001 00 00);
        es.ES_enc28j60PhyWrite(PHLCON,0x990);
        delay(500);
        //
        // 0x880 is PHLCON LEDB=on, LEDA=on
        // enc28j60PhyWrite(PHLCON,0b0000 1000 1000 00 00);
        es.ES_enc28j60PhyWrite(PHLCON,0x880);
        delay(500);
        //
        // 0x990 is PHLCON LEDB=off, LEDA=off
        // enc28j60PhyWrite(PHLCON,0b0000 1001 1001 00 00);
        es.ES_enc28j60PhyWrite(PHLCON,0x990);
        delay(500);
        // 0x476 is PHLCON LEDA=links status, LEDB=receive/transmit
        // enc28j60PhyWrite(PHLCON,0b0000 0100 0111 01 10);
        es.ES_enc28j60PhyWrite(PHLCON,0x476);
        delay(100);

        //init the ethernet/ip layer:
        es.ES_init_ip_arp_udp_tcp(mymac,myip,dest_port);

        // intialize varible;
        syn_ack_timeout =0;
        client_data_ready = 0;
        client_state = IDLE;
        capacity_sent = 0; // NOTE: This should actually default to 0
        
        pinMode(trigPin, OUTPUT);
      pinMode(echoPin, INPUT);
}

void loop()
{

        if(client_data_ready==0)
        {
          digitalWrite(trigPin, LOW);  // Added this line
          delayMicroseconds(2); // Added this line
          digitalWrite(trigPin, HIGH);
        //  delayMicroseconds(1000); - Removed this line
          delayMicroseconds(10); // Added this line
          digitalWrite(trigPin, LOW);
          duration = pulseIn(echoPin, HIGH);
          distance = (duration/2) / 29.1;
                client_data_ready = 1;
                
          Serial.println(distance);
        }
	client_process();
       
}

uint16_t testRequest(uint8_t *buf ) // Create test request
{
	uint16_t plen;
        
	plen= es.ES_fill_tcp_data_p(buf,0, PSTR ( "GET /api/test" ) );
     
        
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( " HTTP/1.0\r\n" ));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "Host: 192.168.1.7\r\n" ));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "User-Agent: AVR ethernet\r\n" ));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "Keep-Alive: 300\r\n" ));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "Connection: close\r\n\r\n" ));

	return plen;
}

uint16_t capacityRequest(uint8_t *buf ) // Create capacity request
{
	
	// TODO: Replace all es.ES_fill_tcp_data_p() with es.ES_fill_tcp_data(), which takes good old char*
	// TODO: Water Capacity should not be hardcoded
	uint16_t plen;
        
	plen= es.ES_fill_tcp_data_p(buf,0, PSTR ( "PUT /api/sense/capacity" ) );
     
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( " HTTP/1.0\r\n" ));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "Host: 192.168.1.7\r\n" ));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "User-Agent: AVR ethernet\r\n" ));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "x-access-token: "));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( TOKEN ));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "\r\nContent-Length: 12\r\n" ));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "Content-Type: application/x-www-form-urlencoded\r\n" ));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "Accept: text/plain\r\n" ));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "Keep-Alive: 300\r\n" ));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "Connection: close\r\n\r\n" ));
        
        plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "capacity=100\r\n" ));

	return plen;
}

uint16_t readingRequest(uint8_t *buf ) // Create sensor reading report/request
{
	uint16_t plen;
	
	// TODO: Replace all es.ES_fill_tcp_data_p() with es.ES_fill_tcp_data(), which takes good old char*
	// TOOD: Water level should actually come from sensor
        
//	level -= 2;
//        if (level <= 1)
//        {
//          level = random(1, 98);
//        }
        level = distance;
	char levelStr[5 + 1]; // Up to five digits supported
	itoa(level, levelStr, 10); // convert to string in base 10
	int levelStrLen = 6 + strlen(levelStr); // `level=` is 6 chars long
	char lenStr[3];
	itoa(levelStrLen, lenStr, 10); // convert length to string in base 10
        
	plen= es.ES_fill_tcp_data_p(buf,0, PSTR ( "POST /api/sense/reading" ) );
     
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( " HTTP/1.0\r\n" ));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "Host: 192.168.1.7\r\n" ));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "User-Agent: AVR ethernet\r\n" ));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "x-access-token: "));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( TOKEN ));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "\r\nContent-Length: " ));
	plen = fill_tcp_data(buf, plen, lenStr);
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "\r\nContent-Type: application/x-www-form-urlencoded\r\n" ));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "Accept: text/plain\r\n" ));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "Keep-Alive: 300\r\n" ));
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "Connection: close\r\n\r\n" ));
	
	plen= es.ES_fill_tcp_data_p(buf, plen, PSTR ( "level=" ));
	plen= fill_tcp_data(buf, plen, levelStr);

	return plen;
}

void client_process ( void )
{
    uint16_t plen;
    uint8_t i;

//    if (client_data_ready == 0)  return;     // nothing to send

	if(client_state == IDLE)
	{   
		// initialize ARP
		Serial.println("In IDLE state.");
		es.ES_make_arp_request(buf, dest_ip);
		client_state = ARP_SENT;
		return;
	}
     
		
	if(client_state == ARP_SENT)
	{
        
        plen = es.ES_enc28j60PacketReceive(BUFFER_SIZE, buf);

		// destination ip address was found on network
        if ( plen!=0 )
        {
            if ( es.ES_arp_packet_is_myreply_arp ( buf ) )
            {
                Serial.println("ARP Reply received.");
                client_state = ARP_REPLY;
		syn_ack_timeout=0;
		return;
            }
		
		}  
	        delay(10);
		syn_ack_timeout++;
			
		if(syn_ack_timeout >= SYNACK_TIMEOUT) {  //timeout, server ip not found
            Serial.println("SYNACK timeout");
			client_state = IDLE;
			syn_ack_timeout=0;
			return;
		}	
	}

	if(client_state == ARP_REPLY){ // ARP Reply received. Send SYN
                Serial.println("Saving MAC address");
		// save dest MAC address
		for(i=0; i<6; i++){
			dest_mac[i] = buf[ETH_SRC_MAC+i];
		}
	
        // Send SYN
        Serial.println("Sending SYN");
        es.ES_tcp_client_send_packet (buf, dest_port, my_port, TCP_FLAG_SYN_V, 1, 1, 0, 0, dest_mac, dest_ip);
		
	client_state = SYNC_SENT;
	}
  // SYN has been sent. Receive packets
  if(client_state == SYNC_SENT){
    plen = es.ES_enc28j60PacketReceive(BUFFER_SIZE, buf);

       // no new packet incoming
        if ( plen == 0 || es.ES_eth_type_is_ip_and_my_ip(buf,plen)==0)
        {
            syn_ack_timeout++;
            if (syn_ack_timeout >= 5)
            {
              Serial.println("Waited too long. Going IDLE.");
              client_state = ARP_REPLY;
              syn_ack_timeout = 0;
            }
            else
            {
              Serial.println("No new packet");
              delay(10);             
            }
            return;
        }

       // Handle SYNACK from server
    if ( buf [ TCP_FLAGS_P ] == ( TCP_FLAG_SYN_V | TCP_FLAG_ACK_V ) )
    {
                Serial.println("Received SYNACK");
               // send ACK to answer SYNACK
                Serial.println("Sending ACK");
               es.ES_tcp_client_send_packet (buf, dest_port, my_port, TCP_FLAG_ACK_V, 0, 0, 1, 0, dest_mac, dest_ip);
 
               /******************************
               THE MAGIC HAPPENSE HERE!!!
               *******************************/
 
               // Ready to send HTTP Request to server
               if (capacity_sent == 0)
               {
                       Serial.println("Creating Capacity PUT Request");
                       // If capacity hasn't been sent yet, then send it
                       plen = capacityRequest(buf);
                       capacity_sent = 1; // Next time, send sensor reading
               }
               else // Otherwise, send sensor reading
               {
                       Serial.println("Creating Sensor Reading POST Request");
                       plen = readingRequest(buf);
               }
               // send http request packet
               // send packet with PSHACK
               Serial.println("Sending HTTP Request");
               es.ES_tcp_client_send_packet (buf, dest_port, my_port, TCP_FLAG_ACK_V | TCP_FLAG_PUSH_V, 0, 0, 0, plen, dest_mac, dest_ip);
               return;
       }
       // Handle server PSHACK response
       if ( buf [ TCP_FLAGS_P ] == (TCP_FLAG_ACK_V|TCP_FLAG_PUSH_V) )
       {
               Serial.println("Server Responded");
               plen = es.ES_tcp_get_dlength( (uint8_t*)&buf );

               // send ACK to answer PSHACK from server
               Serial.println("Acknowledging server response");
               es.ES_tcp_client_send_packet (buf, dest_port, my_port, TCP_FLAG_ACK_V, 0, 0, plen, 0, dest_mac, dest_ip);
               return;
               
               // NOTE: We wait for the server to close the connection
               
       }
       // Answer FINACK from web server by sending our own FINACK
       if ( buf [ TCP_FLAGS_P ] == (TCP_FLAG_ACK_V|TCP_FLAG_FIN_V) )
       {
               Serial.println("Server wants to terminate connection");
               es.ES_tcp_client_send_packet (buf, dest_port, my_port, TCP_FLAG_FIN_V|TCP_FLAG_ACK_V, 0, 0, 1, 0, dest_mac, dest_ip);
                client_state = ARP_REPLY; // return to IDLE state
                client_data_ready = 0; // Wait for new data to be recorded
                lingering = 0;
                return;
        }
        
        if (lingering >= 5)
        {
          client_state = ARP_REPLY;
          client_data_ready = 1;
          lingering = 0;
        }
        
        lingering++;
  }       
}
