#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

class DatabaseGraphAPITester:
    def __init__(self, base_url="https://db-graph-viz.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.errors = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                self.errors.append(f"{name}: {error_msg}")
                print(f"❌ Failed - {error_msg}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response text: {response.text[:200]}")

            return success, {}

        except Exception as e:
            error_msg = f"Error: {str(e)}"
            self.errors.append(f"{name}: {error_msg}")
            print(f"❌ Failed - {error_msg}")
            return False, {}

    def test_stats_endpoint(self):
        """Test /api/stats endpoint"""
        success, response = self.run_test(
            "Stats Endpoint",
            "GET",
            "stats",
            200
        )
        
        if success and isinstance(response, dict):
            if 'views_count' in response and 'relations_count' in response:
                print(f"   📊 Views: {response.get('views_count')}, Relations: {response.get('relations_count')}")
                return True
        return False

    def test_clear_all_data(self):
        """Clear all existing data for clean testing"""
        success, response = self.run_test(
            "Clear All Data",
            "DELETE",
            "clear-all",
            200
        )
        return success

    def test_import_sql(self):
        """Test SQL import with sample ViewRelation data"""
        sample_sql = """INSERT INTO Report_ViewRelation (IdView1, IdView2, Relation, Relation2, EdgeWeight, MinAppVersion, MaxAppVersion, ChangeOwner) VALUES(19528, 51, 'LEFT JOIN Shop ON Shop.CountryIsoCode = Loc__Country.Alpha3', 'LEFT JOIN Shop ON Shop.CountryIsoCode = DBCommon.Loc__Country.Alpha3', 10, 2000000, 999999999, 1);
INSERT INTO Report_ViewRelation (IdView1, IdView2, Relation, EdgeWeight) VALUES(100, 200, 'INNER JOIN Users ON Users.id = Orders.user_id', 5);"""
        
        success, response = self.run_test(
            "SQL Import",
            "POST",
            "import-sql",
            200,
            data={"sql": sample_sql}
        )
        
        if success and isinstance(response, dict):
            print(f"   📈 Views created: {response.get('views_created', 0)}")
            print(f"   📈 Relations created: {response.get('relations_created', 0)}")
            print(f"   ⚠️  Errors: {len(response.get('errors', []))}")
            return True
        return False

    def test_views_endpoint(self):
        """Test /api/views endpoint"""
        # Test get all views
        success, response = self.run_test(
            "Get All Views",
            "GET",
            "views",
            200
        )
        
        if not success:
            return False
        
        views = response if isinstance(response, list) else []
        print(f"   📋 Found {len(views)} views")
        
        if len(views) > 0:
            # Test search functionality
            success, filtered_response = self.run_test(
                "Search Views",
                "GET",
                "views",
                200,
                params={"search": "View"}
            )
            
            if success:
                filtered_views = filtered_response if isinstance(filtered_response, list) else []
                print(f"   🔍 Filtered to {len(filtered_views)} views")
        
        return success

    def test_graph_data_endpoint(self):
        """Test /api/graph-data endpoint"""
        success, response = self.run_test(
            "Graph Data",
            "GET",
            "graph-data",
            200
        )
        
        if success and isinstance(response, dict):
            nodes = response.get('nodes', [])
            edges = response.get('edges', [])
            print(f"   📊 Graph nodes: {len(nodes)}, edges: {len(edges)}")
            
            # Verify structure
            if nodes and isinstance(nodes[0], dict):
                node = nodes[0]
                required_fields = ['id', 'view_id', 'display_name']
                if all(field in node for field in required_fields):
                    print("   ✅ Node structure is correct")
                else:
                    print(f"   ⚠️  Node missing fields: {[f for f in required_fields if f not in node]}")
            
            if edges and isinstance(edges[0], dict):
                edge = edges[0]
                required_fields = ['id', 'source', 'target', 'relation']
                if all(field in edge for field in required_fields):
                    print("   ✅ Edge structure is correct")
                else:
                    print(f"   ⚠️  Edge missing fields: {[f for f in required_fields if f not in edge]}")
            
            return True
        return False

    def test_create_view(self):
        """Test creating a new view"""
        test_view = {
            "view_id": 999,
            "name": "Test_View",
            "name2": "Test View 2",
            "alias": "TestV"
        }
        
        success, response = self.run_test(
            "Create View",
            "POST",
            "views",
            200,
            data=test_view
        )
        
        if success:
            print("   ✅ View created successfully")
            
            # Test duplicate creation should fail
            success_dup, response_dup = self.run_test(
                "Create Duplicate View (should fail)",
                "POST",
                "views",
                400,
                data=test_view
            )
            
            if success_dup:
                print("   ✅ Duplicate view rejection works")
            
            return True
        return False

    def test_create_relation(self):
        """Test creating a new relation"""
        test_relation = {
            "id_view1": 999,
            "id_view2": 51,
            "relation": "LEFT JOIN test_table ON test_condition",
            "edge_weight": 5
        }
        
        success, response = self.run_test(
            "Create Relation",
            "POST",
            "relations",
            200,
            data=test_relation
        )
        
        if success:
            print("   ✅ Relation created successfully")
            return True
        return False

    def test_relations_endpoint(self):
        """Test /api/relations endpoint"""
        success, response = self.run_test(
            "Get All Relations",
            "GET",
            "relations",
            200
        )
        
        if success:
            relations = response if isinstance(response, list) else []
            print(f"   📋 Found {len(relations)} relations")
            return True
        return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Database Graph API Tests...")
        print(f"Testing endpoint: {self.api_url}")
        
        # Test basic connectivity and stats
        if not self.test_stats_endpoint():
            print("❌ Basic connectivity failed, stopping tests")
            return False
        
        # Clear existing data for clean testing
        self.test_clear_all_data()
        
        # Test SQL import functionality
        if not self.test_import_sql():
            print("❌ SQL import failed, continuing with other tests")
        
        # Test view endpoints
        self.test_views_endpoint()
        
        # Test graph data endpoint
        self.test_graph_data_endpoint()
        
        # Test create operations
        self.test_create_view()
        self.test_create_relation()
        
        # Test relations endpoint
        self.test_relations_endpoint()
        
        # Final stats check
        self.test_stats_endpoint()
        
        return True

    def print_summary(self):
        """Print test summary"""
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%" if self.tests_run > 0 else "N/A")
        
        if self.errors:
            print(f"\n❌ Failed tests:")
            for error in self.errors:
                print(f"  - {error}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = DatabaseGraphAPITester()
    
    try:
        tester.run_all_tests()
        success = tester.print_summary()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())